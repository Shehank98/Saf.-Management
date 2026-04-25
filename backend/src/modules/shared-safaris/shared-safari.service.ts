import { prisma } from '../../config/database';
import { addHours } from '../../utils/date-helpers';

const MIN_SEATS = 4;
const MAX_SEATS = 6;

export async function getAvailableDates(ownerId?: string) {
  const jeeps = await prisma.sharedJeep.findMany({
    where: {
      safariDate: { gte: new Date() },
      status: { in: ['OPEN', 'PENDING_PAYMENT', 'CONFIRMED'] },
      ...(ownerId ? { ownerId } : {}),
    },
    select: { safariDate: true, safariType: true, reservedSeats: true, paidSeats: true, totalSeats: true, status: true },
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

    const newReservedCount = jeep.bookings.length + 1;

    let updateData: any = { reservedSeats: { increment: 1 } };

    if (newReservedCount >= MIN_SEATS && jeep.status === 'OPEN') {
      updateData.status = 'PENDING_PAYMENT';
      updateData.paymentDeadline = addHours(new Date(), 24);
    }

    if (newReservedCount >= MAX_SEATS) {
      updateData.status = 'FULLY_BOOKED';
    }

    await tx.sharedJeep.update({ where: { id: jeepId }, data: updateData });

    return newBooking;
  });

  return booking;
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

  await prisma.$transaction(async (tx) => {
    await tx.sharedSafariBooking.update({
      where: { id: bookingId },
      data: { status: 'PAID', paidAt: new Date(), paymentId },
    });

    const jeepUpdate: any = { paidSeats: { increment: 1 } };

    if (paidCount >= MIN_SEATS && booking.jeep.status !== 'CONFIRMED') {
      jeepUpdate.status = 'CONFIRMED';
    }

    await tx.sharedJeep.update({ where: { id: booking.jeepId }, data: jeepUpdate });
  });

  return { bookingId, paidSeats: paidCount };
}

export async function createSharedJeep(ownerId: string, data: {
  safariDate: string;
  safariType: string;
  pricePerSeat: number;
}) {
  const safariDate = new Date(data.safariDate);
  const safariDeadline = addHours(safariDate, -24);

  return prisma.sharedJeep.create({
    data: {
      ownerId,
      safariDate,
      safariType: data.safariType,
      pricePerSeat: data.pricePerSeat,
      safariDeadline,
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
    },
    orderBy: { safariDate: 'desc' },
  });
}

export async function assignVendors(
  jeepId: string,
  vendors: { guideVendorId?: string; jeepVendorId?: string; guideFee?: number; jeepRentalFee?: number; jeepNumber?: string }
) {
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
