import { prisma } from '../../config/database';

export async function createInquiry(ownerId: string, data: {
  safariDate: string;
  safariType: string;
  numberOfGuests: number;
  totalAmount: number;
  depositPercentage?: number;
}) {
  const depositPct = data.depositPercentage || 30;
  const depositAmount = (data.totalAmount * depositPct) / 100;

  return prisma.privateSafari.create({
    data: {
      ownerId,
      safariDate: new Date(data.safariDate),
      safariType: data.safariType,
      numberOfGuests: data.numberOfGuests,
      totalAmount: data.totalAmount,
      depositAmount,
      status: 'INQUIRY',
    },
  });
}

export async function getPrivateSafari(id: string) {
  return prisma.privateSafari.findUnique({
    where: { id },
    include: {
      booking: { include: { customer: { include: { user: { select: { name: true, phone: true, email: true } } } } } },
      jeepAssignment: { include: { vendor: { include: { user: { select: { name: true } } } } } },
      guideAssignment: { include: { vendor: { include: { user: { select: { name: true } } } } } },
      mealOrders: { include: { vendor: { include: { user: { select: { name: true } } } } } },
    },
  });
}

export async function updateStatus(id: string, status: string) {
  return prisma.privateSafari.update({ where: { id }, data: { status: status as any } });
}

export async function assignVendors(id: string, vendors: {
  jeepVendorId?: string;
  guideVendorId?: string;
  jeepNumber?: string;
  rentalFee?: number;
  guideFee?: number;
}) {
  const ops: any[] = [];

  if (vendors.jeepVendorId && vendors.jeepNumber && vendors.rentalFee !== undefined) {
    ops.push(
      prisma.jeepAssignment.upsert({
        where: { privateSafariId: id },
        update: { vendorId: vendors.jeepVendorId, jeepNumber: vendors.jeepNumber, rentalFee: vendors.rentalFee },
        create: { vendorId: vendors.jeepVendorId, privateSafariId: id, jeepNumber: vendors.jeepNumber, rentalFee: vendors.rentalFee },
      })
    );
  }

  if (vendors.guideVendorId && vendors.guideFee !== undefined) {
    ops.push(
      prisma.guideAssignment.upsert({
        where: { privateSafariId: id },
        update: { vendorId: vendors.guideVendorId, guideFee: vendors.guideFee },
        create: { vendorId: vendors.guideVendorId, privateSafariId: id, guideFee: vendors.guideFee },
      })
    );
  }

  if (ops.length > 0) await prisma.$transaction(ops);
}

export async function getOwnerSafaris(ownerId: string, status?: string) {
  return prisma.privateSafari.findMany({
    where: {
      ownerId,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      booking: { include: { customer: { include: { user: { select: { name: true } } } } } },
    },
    orderBy: { safariDate: 'desc' },
  });
}

export async function bookPrivateSafari(safariId: string, customerId: string, specialRequests?: string) {
  const safari = await prisma.privateSafari.findUnique({ where: { id: safariId } });
  if (!safari) throw Object.assign(new Error('Safari not found'), { status: 404 });
  if (safari.status !== 'INQUIRY' && safari.status !== 'DEPOSIT_PENDING') {
    throw Object.assign(new Error('Safari not available for booking'), { status: 400 });
  }

  return prisma.$transaction(async (tx) => {
    const booking = await tx.privateSafariBooking.create({
      data: { safariId, customerId, specialRequests },
    });
    await tx.privateSafari.update({
      where: { id: safariId },
      data: { status: 'DEPOSIT_PENDING' },
    });
    return booking;
  });
}
