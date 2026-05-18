import { prisma } from '../../config/database';
import { addHours } from '../../utils/date-helpers';
import { sendWhatsApp } from '../notifications/whatsapp.service';
import { logger } from '../../utils/logger';
import { randomBytes } from 'crypto';
import { onFourthSeatReserved, onAdditionalSeatReserved } from '../../lib/triggers/fourthSeatTrigger';

const MIN_SEATS = 4;
const MAX_SEATS = 6;

export async function getAvailableDates(ownerId?: string, locationId?: string) {
  const jeeps = await prisma.sharedJeep.findMany({
    where: {
      safariDate: { gte: new Date() },
      status: { in: ['OPEN', 'PENDING_PAYMENT', 'CONFIRMED'] },
      ...(ownerId ? { ownerId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    select: { safariDate: true, safariType: true, reservedSeats: true, paidSeats: true, totalSeats: true, status: true, locationId: true },
    orderBy: { safariDate: 'asc' },
  });

  const dateMap = new Map<string, typeof jeeps>();
  for (const jeep of jeeps) {
    const key = jeep.safariDate.toISOString().split('T')[0];
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(jeep);
  }

  return Array.from(dateMap.entries()).map(([date, items]) => {
    // Aggregate multiple jeeps of the same type — sum available seats so duplicates
    // (auto-scheduled + manually created, or overflow jeeps) collapse into one row.
    const typeMap = new Map<string, { availableSeats: number; status: string; locationId: string | null }>();
    for (const j of items) {
      const avail = j.totalSeats - j.reservedSeats - j.paidSeats;
      if (!typeMap.has(j.safariType)) {
        typeMap.set(j.safariType, { availableSeats: avail, status: j.status, locationId: j.locationId });
      } else {
        typeMap.get(j.safariType)!.availableSeats += avail;
      }
    }
    return {
      date,
      safariTypes: Array.from(typeMap.entries()).map(([type, d]) => ({
        type,
        availableSeats: Math.max(0, d.availableSeats),
        status: d.status,
        locationId: d.locationId,
      })),
    };
  });
}

export async function getJeepsByDateAndType(date: string, safariType: string) {
  const allJeeps = await prisma.sharedJeep.findMany({
    where: {
      safariDate: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) },
      safariType,
      status: { in: ['OPEN', 'PENDING_PAYMENT', 'CONFIRMED'] },
    },
    include: {
      bookings: {
        select: { seatNumber: true, rowPosition: true, status: true },
      },
      owner: { select: { companyName: true } },
    },
  });

  // For each owner, show only one jeep: the most-filled one that still has open seats.
  // This prevents showing both a manually-created and an auto-scheduled jeep for the same
  // owner/date/type, and hides the original PENDING_PAYMENT jeep once an overflow OPEN
  // jeep is created (so customers always book into the most-consolidated slot).
  const byOwner = new Map<string, typeof allJeeps>();
  for (const jeep of allJeeps) {
    if (!byOwner.has(jeep.ownerId)) byOwner.set(jeep.ownerId, []);
    byOwner.get(jeep.ownerId)!.push(jeep);
  }

  const result: typeof allJeeps = [];
  for (const ownerJeeps of byOwner.values()) {
    const withSeats = ownerJeeps.filter(
      (j) => j.totalSeats - j.reservedSeats - j.paidSeats > 0,
    );
    if (withSeats.length === 0) continue;

    // Prefer PENDING_PAYMENT (most filled) → OPEN; within same status prefer most bookings
    const STATUS_PRIO: Record<string, number> = { PENDING_PAYMENT: 0, CONFIRMED: 1, OPEN: 2 };
    withSeats.sort((a, b) => {
      const pa = STATUS_PRIO[a.status] ?? 3;
      const pb = STATUS_PRIO[b.status] ?? 3;
      if (pa !== pb) return pa - pb;
      return (b.reservedSeats + b.paidSeats) - (a.reservedSeats + a.paidSeats);
    });
    result.push(withSeats[0]);
  }

  return result;
}

export async function reserveSeat(
  jeepId: string,
  customerId: string,
  seatNumber: number,
  pickupData: {
    pickupLocation: string;
    pickupLat: number;
    pickupLng: number;
    pickupTime: string;
    mealIncluded?: boolean;
    mealTypes?: string[];
    dietaryReqs?: string[];
    allergies?: string;
    specialNotes?: string;
    cameraNeeded?: boolean;
  }
) {
  const jeep = await prisma.sharedJeep.findUnique({
    where: { id: jeepId },
    include: { bookings: { where: { status: { in: ['RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'] } } } },
  });

  if (!jeep) throw Object.assign(new Error('Safari not found'), { status: 404 });
  if (jeep.status === 'FULLY_BOOKED' || jeep.status === 'CANCELLED' || jeep.status === 'COMPLETED') {
    throw Object.assign(new Error('Safari not available for booking'), { status: 400 });
  }

  const seatTaken = jeep.bookings.find((b) => b.seatNumber === seatNumber);
  if (seatTaken) throw Object.assign(new Error(`Seat ${seatNumber} is already taken`), { status: 409 });

  if (jeep.bookings.length >= MAX_SEATS) {
    throw Object.assign(new Error('Safari fully booked'), { status: 409 });
  }

  const ROW_MAP: Record<number, string> = { 1: 'Front', 2: 'Front', 3: 'Middle', 4: 'Middle', 5: 'Back', 6: 'Back' };
  const rowPosition = ROW_MAP[seatNumber] || 'Back';

  const mealPrice = pickupData.mealIncluded ? 500 : 0;
  const cameraRentalPrice = pickupData.cameraNeeded ? 1500 : 0;
  const basePrice = parseFloat(jeep.pricePerSeat.toString());
  const totalAmount = basePrice + mealPrice + cameraRentalPrice;

  const newReservedCount = jeep.bookings.length + 1;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.sharedSafariBooking.create({
        data: {
          jeepId,
          customerId,
          seatNumber,
          rowPosition,
          status: 'RESERVED',
          basePrice,
          mealPrice,
          cameraRental: cameraRentalPrice,
          totalAmount,
          pickupLocation: pickupData.pickupLocation,
          pickupLat: pickupData.pickupLat ?? null,
          pickupLng: pickupData.pickupLng ?? null,
          pickupTime: pickupData.pickupTime || '5:45 AM',
          mealIncluded: pickupData.mealIncluded || false,
          mealTypes: pickupData.mealTypes || [],
          dietaryReqs: pickupData.dietaryReqs || [],
          allergies: pickupData.allergies || null,
          specialNotes: pickupData.specialNotes || null,
          cameraNeeded: pickupData.cameraNeeded || false,
        },
      });

      let updateData: any = { reservedSeats: { increment: 1 } };
      if (newReservedCount >= MAX_SEATS) {
        updateData.status = 'FULLY_BOOKED';
      }

      await tx.sharedJeep.update({ where: { id: jeepId }, data: updateData });

      return newBooking;
    });

    // Kick off async triggers without blocking the HTTP response
    if (newReservedCount === MIN_SEATS) {
    // 4th seat: trigger payment links for all customers + notify owner + create overflow jeep
      setImmediate(() =>
        onFourthSeatReserved(jeepId).catch((err) =>
          logger.error(`4th-seat trigger failed for jeep ${jeepId}:`, err)
        )
      );
    } else if (jeep.status === 'PENDING_PAYMENT') {
      setImmediate(() =>
        onAdditionalSeatReserved(jeepId, booking.id).catch((err) =>
          logger.error(`Additional-seat trigger failed for booking ${booking.id}:`, err)
        )
      );
    }

    return booking;
  } catch (err: any) {
    // Prisma unique constraint → seat was taken between our check and insert
    if (err?.code === 'P2002') {
      throw Object.assign(new Error(`Seat ${seatNumber} was just taken by another customer`), { status: 409 });
    }
    throw err;
  }
}

export async function getBookingById(bookingId: string) {
  return prisma.sharedSafariBooking.findUnique({
    where: { id: bookingId },
    include: {
      jeep: { include: { owner: { select: { companyName: true } } } },
      customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
    },
  });
}

export async function confirmPayment(bookingId: string, paymentId: string) {
  const booking = await prisma.sharedSafariBooking.findUnique({
    where: { id: bookingId },
    include: { jeep: { include: { bookings: { where: { status: 'PAID' } } } } },
  });

  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });

  const paidCount = booking.jeep.bookings.length + 1;
  const willConfirm = paidCount >= MIN_SEATS;

  await prisma.$transaction(async (tx) => {
    await tx.sharedSafariBooking.update({
      where: { id: bookingId },
      data: { status: 'PAID', paidAt: new Date(), paymentId },
    });

    const jeepUpdate: any = { paidSeats: { increment: 1 } };
    if (willConfirm && booking.jeep.status !== 'CONFIRMED') {
      jeepUpdate.status = 'CONFIRMED';
    }

    await tx.sharedJeep.update({ where: { id: booking.jeepId }, data: jeepUpdate });
  });

  // When jeep first confirms, cancel other pending bookings for customers in this jeep
  if (willConfirm) {
    setImmediate(() => {
      cancelConflictingBookings(booking.jeepId, booking.customerId).catch((err) =>
        logger.error(`Failed to cancel conflicting bookings for jeep ${booking.jeepId}:`, err)
      );
    });
  }

  return { bookingId, paidSeats: paidCount };
}

async function cancelConflictingBookings(confirmedJeepId: string, triggeringCustomerId: string): Promise<void> {
  // Fetch the confirmed jeep to get confirmed date
  const confirmedJeep = await prisma.sharedJeep.findUnique({ where: { id: confirmedJeepId } });
  if (!confirmedJeep) return;

  // Get all paid customers in this jeep
  const paidBookings = await prisma.sharedSafariBooking.findMany({
    where: { jeepId: confirmedJeepId, status: 'PAID' },
    select: { customerId: true },
  });
  const confirmedCustomerIds = paidBookings.map((b) => b.customerId);

  // Find RESERVED or PAYMENT_PENDING bookings for these customers on OTHER jeeps
  const conflicting = await prisma.sharedSafariBooking.findMany({
    where: {
      customerId: { in: confirmedCustomerIds },
      jeepId: { not: confirmedJeepId },
      status: { in: ['RESERVED', 'PAYMENT_PENDING'] },
    },
    include: {
      customer: { include: { user: true } },
      jeep: true,
    },
  });

  for (const conflict of conflicting) {
    try {
      await prisma.$transaction([
        prisma.sharedSafariBooking.update({
          where: { id: conflict.id },
          data: { status: 'AUTO_CANCELLED' },
        }),
        prisma.sharedJeep.update({
          where: { id: conflict.jeepId },
          data: { reservedSeats: { decrement: 1 } },
        }),
      ]);

      await sendWhatsApp({
        to: conflict.customer.user.phone,
        template: 'booking_conflict_cancelled',
        recipientId: conflict.customer.userId,
        data: {
          cancelledDate: conflict.jeep.safariDate.toDateString(),
          confirmedDate: confirmedJeep.safariDate.toDateString(),
        },
      }).catch(() => {});

      logger.info(`Auto-cancelled conflicting booking ${conflict.id} for customer ${conflict.customerId}`);
    } catch (err) {
      logger.error(`Failed to auto-cancel conflict booking ${conflict.id}:`, err);
    }
  }
}

export async function checkCustomerConflicts(customerId: string, jeepId: string) {
  const pendingBookings = await prisma.sharedSafariBooking.findMany({
    where: {
      customerId,
      jeepId: { not: jeepId },
      status: { in: ['RESERVED', 'PAYMENT_PENDING', 'PAID'] },
    },
    include: { jeep: { select: { safariDate: true, safariType: true, status: true } } },
  });

  return pendingBookings.map((b) => ({
    bookingId: b.id,
    safariDate: b.jeep.safariDate,
    safariType: b.jeep.safariType,
    status: b.status,
    jeepStatus: b.jeep.status,
  }));
}

export async function createSharedJeep(ownerId: string, data: {
  safariDate: string;
  safariType: string;
  pricePerSeat: number;
  locationId: string;
}) {
  const safariDate = new Date(data.safariDate);
  const safariDeadline = addHours(safariDate, -24);

  if (data.locationId) {
    const ownerLoc = await prisma.safariOwnerLocation.findFirst({
      where: { ownerId, locationId: data.locationId },
    });
    if (!ownerLoc) {
      throw Object.assign(new Error('You do not operate in this location'), { status: 403 });
    }
  }

  const token = randomBytes(16).toString('hex');
  return prisma.sharedJeep.create({
    data: {
      ownerId,
      safariDate,
      safariType: data.safariType,
      pricePerSeat: data.pricePerSeat,
      safariDeadline,
      locationId: data.locationId || null,
      bookingLinkToken: token,
    },
  });
}

export async function getOwnerSharedJeeps(ownerId: string) {
  return prisma.sharedJeep.findMany({
    where: { ownerId },
    include: {
      bookings: {
        // Only active bookings — exclude cancelled/released so counts and lists are accurate
        where: { status: { in: ['RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'] } },
        include: {
          customer: { include: { user: { select: { name: true, phone: true } } } },
        },
      },
      jeepAssignment: { include: { vendor: { include: { user: { select: { name: true } } } } } },
      guideAssignment: { include: { vendor: { include: { user: { select: { name: true } } } } } },
      location: { select: { id: true, name: true } },
    },
    orderBy: { safariDate: 'desc' },
  });
}

export async function assignVendors(
  jeepId: string,
  vendors: { guideVendorId?: string; jeepVendorId?: string; guideFee?: number; jeepRentalFee?: number; jeepNumber?: string }
) {
  const jeep = await prisma.sharedJeep.findUnique({ where: { id: jeepId }, select: { locationId: true } });
  if (jeep?.locationId) {
    if (vendors.jeepVendorId) {
      const ok = await prisma.vendorLocation.findFirst({ where: { vendorId: vendors.jeepVendorId, locationId: jeep.locationId } });
      if (!ok) throw Object.assign(new Error('Jeep vendor does not service this location'), { status: 400 });
    }
    if (vendors.guideVendorId) {
      const ok = await prisma.vendorLocation.findFirst({ where: { vendorId: vendors.guideVendorId, locationId: jeep.locationId } });
      if (!ok) throw Object.assign(new Error('Guide vendor does not service this location'), { status: 400 });
    }
  }

  const ops: any[] = [];

  if (vendors.jeepVendorId && vendors.jeepNumber && vendors.jeepRentalFee !== undefined) {
    ops.push(
      prisma.jeepAssignment.upsert({
        where: { sharedJeepId: jeepId },
        update: { vendorId: vendors.jeepVendorId, rentalFee: vendors.jeepRentalFee, jeepNumber: vendors.jeepNumber },
        create: { vendorId: vendors.jeepVendorId, sharedJeepId: jeepId, rentalFee: vendors.jeepRentalFee, jeepNumber: vendors.jeepNumber },
      })
    );
  }

  if (vendors.guideVendorId && vendors.guideFee !== undefined) {
    ops.push(
      prisma.guideAssignment.upsert({
        where: { sharedJeepId: jeepId },
        update: { vendorId: vendors.guideVendorId, guideFee: vendors.guideFee },
        create: { vendorId: vendors.guideVendorId, sharedJeepId: jeepId, guideFee: vendors.guideFee },
      })
    );
  }

  if (ops.length > 0) await prisma.$transaction(ops);
}

export async function getPaymentTracking(jeepId: string, requestingOwnerId?: string) {
  const jeep = await prisma.sharedJeep.findUnique({
    where: { id: jeepId },
    include: {
      bookings: {
        include: {
          customer: { include: { user: { select: { name: true, phone: true } } } },
        },
        orderBy: { seatNumber: 'asc' },
      },
      guideAssignment: { include: { vendor: { include: { user: { select: { name: true } } } } } },
    },
  });

  if (!jeep) return null;
  if (requestingOwnerId && jeep.ownerId !== requestingOwnerId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const now = new Date();
  const seats = jeep.bookings.map((b) => {
    const msLeft = b.paymentDeadline ? b.paymentDeadline.getTime() - now.getTime() : null;
    return {
      bookingId: b.id,
      seatNumber: b.seatNumber,
      customerName: b.customer.user.name,
      customerPhone: b.customer.user.phone,
      status: b.status,
      amount: b.totalAmount,
      paymentDeadline: b.paymentDeadline,
      minutesRemaining: msLeft !== null ? Math.max(0, Math.floor(msLeft / 60000)) : null,
      paidAt: b.paidAt,
    };
  });

  return {
    jeepId: jeep.id,
    safariDate: jeep.safariDate,
    safariType: jeep.safariType,
    status: jeep.status,
    paidSeats: jeep.paidSeats,
    reservedSeats: jeep.reservedSeats,
    paymentDeadline: jeep.paymentDeadline,
    guideName: jeep.guideAssignment?.vendor?.user?.name || null,
    seats,
  };
}

export async function autoScheduleJeeps(
  ownerId: string,
  pricing: { priceFullDay: number | null; priceHalfDayMorning: number | null; priceHalfDayAfternoon: number | null },
  daysAhead = 30,
): Promise<number> {
  const types = [
    { type: 'Full Day', price: pricing.priceFullDay },
    { type: 'Half Day Morning', price: pricing.priceHalfDayMorning },
    { type: 'Half Day Afternoon', price: pricing.priceHalfDayAfternoon },
  ].filter((t) => t.price !== null && t.price > 0) as { type: string; price: number }[];

  if (types.length === 0) return 0;

  let created = 0;
  const today = new Date();

  for (let d = 1; d <= daysAhead; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date.getTime() + 86400000);

    for (const { type, price } of types) {
      const existing = await prisma.sharedJeep.findFirst({
        where: { ownerId, safariDate: { gte: date, lt: nextDate }, safariType: type },
        select: { id: true },
      });
      if (!existing) {
        const token = randomBytes(16).toString('hex');
        await prisma.sharedJeep.create({
          data: {
            ownerId,
            safariDate: date,
            safariType: type,
            pricePerSeat: price,
            safariDeadline: new Date(date.getTime() - 24 * 60 * 60 * 1000),
            bookingLinkToken: token,
          },
        });
        created++;
      }
    }
  }

  logger.info(`autoScheduleJeeps: created ${created} slots for owner ${ownerId}`);
  return created;
}

export async function generateBookingLink(jeepId: string) {
  const token = randomBytes(16).toString('hex');
  await prisma.sharedJeep.update({
    where: { id: jeepId },
    data: { bookingLinkToken: token },
  });
  const webAppUrl = process.env.WEB_APP_URL || 'https://your-app.up.railway.app';
  return { token, url: `${webAppUrl}/book/link/${token}` };
}

export async function getJeepByBookingToken(token: string) {
  return prisma.sharedJeep.findUnique({
    where: { bookingLinkToken: token },
    include: {
      bookings: { select: { seatNumber: true, status: true } },
      owner: { select: { companyName: true } },
    },
  });
}
