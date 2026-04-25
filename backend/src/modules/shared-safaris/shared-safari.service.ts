import { prisma } from '../../config/database';
import { addHours } from '../../utils/date-helpers';
import { sendWhatsApp } from '../notifications/whatsapp.service';
import { logger } from '../../utils/logger';
import { randomBytes } from 'crypto';

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

  return Array.from(dateMap.entries()).map(([date, items]) => ({
    date,
    safariTypes: items.map((j) => ({
      type: j.safariType,
      availableSeats: j.totalSeats - j.reservedSeats,
      status: j.status,
      locationId: j.locationId,
    })),
  }));
}

export async function getJeepsByDateAndType(date: string, safariType: string) {
  return prisma.sharedJeep.findMany({
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
  if (seatTaken) throw Object.assign(new Error('Seat already taken'), { status: 409 });

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
        pickupLat: pickupData.pickupLat,
        pickupLng: pickupData.pickupLng,
        pickupTime: pickupData.pickupTime,
        mealIncluded: pickupData.mealIncluded || false,
        mealTypes: pickupData.mealTypes || [],
        dietaryReqs: pickupData.dietaryReqs || [],
        allergies: pickupData.allergies,
        specialNotes: pickupData.specialNotes,
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

  // When 4th seat is reserved: trigger payment links for all, create new jeep
  if (newReservedCount === MIN_SEATS) {
    setImmediate(() => {
      triggerPaymentLinksForJeep(jeepId).catch((err) =>
        logger.error(`Failed to trigger payment links for jeep ${jeepId}:`, err)
      );
      autoCreateJeep(jeep).catch((err) =>
        logger.error(`Failed to auto-create jeep for ${jeepId}:`, err)
      );
    });
  }

  return booking;
}

async function triggerPaymentLinksForJeep(jeepId: string): Promise<void> {
  const deadline = addHours(new Date(), 24);

  const bookings = await prisma.sharedSafariBooking.findMany({
    where: { jeepId, status: 'RESERVED' },
    include: {
      customer: { include: { user: true } },
      jeep: true,
    },
  });

  if (bookings.length < MIN_SEATS) return;

  // Mark jeep as PENDING_PAYMENT and set deadline
  await prisma.sharedJeep.update({
    where: { id: jeepId },
    data: { status: 'PENDING_PAYMENT', paymentDeadline: deadline },
  });

  const webAppUrl = process.env.WEB_APP_URL || 'https://your-app.up.railway.app';

  for (const booking of bookings) {
    const paymentLink = `${webAppUrl}/pay/${booking.id}`;

    await prisma.sharedSafariBooking.update({
      where: { id: booking.id },
      data: {
        status: 'PAYMENT_PENDING',
        paymentDeadline: deadline,
        paymentLinkSent: new Date(),
      },
    });

    await sendWhatsApp({
      to: booking.customer.user.phone,
      template: 'payment_request',
      recipientId: booking.customer.userId,
      data: {
        date: booking.jeep.safariDate.toDateString(),
        amount: booking.totalAmount,
        deadline: deadline.toLocaleString('en-US', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' }),
        paymentLink,
      },
    }).catch(() => {});
  }

  logger.info(`Payment links sent to ${bookings.length} customers for jeep ${jeepId}`);
}

async function autoCreateJeep(originalJeep: { ownerId: string; safariDate: Date; safariType: string; pricePerSeat: any; safariDeadline: Date }): Promise<void> {
  const newJeep = await prisma.sharedJeep.create({
    data: {
      ownerId: originalJeep.ownerId,
      safariDate: originalJeep.safariDate,
      safariType: originalJeep.safariType,
      pricePerSeat: originalJeep.pricePerSeat,
      safariDeadline: originalJeep.safariDeadline,
    },
  });
  logger.info(`Auto-created new jeep ${newJeep.id} for date ${originalJeep.safariDate.toDateString()} type ${originalJeep.safariType}`);
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

  return prisma.sharedJeep.create({
    data: {
      ownerId,
      safariDate,
      safariType: data.safariType,
      pricePerSeat: data.pricePerSeat,
      safariDeadline,
      locationId: data.locationId || null,
    },
  });
}

export async function getOwnerSharedJeeps(ownerId: string) {
  return prisma.sharedJeep.findMany({
    where: { ownerId },
    include: {
      bookings: {
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

export async function getPaymentTracking(jeepId: string) {
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
