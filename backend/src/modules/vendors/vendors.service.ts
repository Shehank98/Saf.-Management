import { prisma } from '../../config/database';
import { addMonths } from '../../utils/date-helpers';

export async function getVendorProfile(userId: string) {
  return prisma.vendor.findUnique({
    where: { userId },
    include: { user: { select: { id: true, email: true, name: true, phone: true } } },
  });
}

export async function updateAvailability(userId: string, isAvailable: boolean, blockedDates?: Date[]) {
  return prisma.vendor.update({
    where: { userId },
    data: {
      isAvailable,
      ...(blockedDates ? { blockedDates } : {}),
    },
  });
}

export async function getVendorDashboard(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: {
      jeepAssignments: {
        where: {
          OR: [
            { privateSafari: { safariDate: { gte: new Date() } } },
            { sharedJeep: { safariDate: { gte: new Date() } } },
          ],
        },
        include: {
          privateSafari: true,
          sharedJeep: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      guideAssignments: {
        where: {
          OR: [
            { privateSafari: { safariDate: { gte: new Date() } } },
            { sharedJeep: { safariDate: { gte: new Date() } } },
          ],
        },
        include: {
          privateSafari: true,
          sharedJeep: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      payments: {
        where: { status: 'PENDING' },
        select: { amount: true, description: true, createdAt: true },
      },
    },
  });

  if (!vendor) throw Object.assign(new Error('Vendor not found'), { status: 404 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyEarnings = await prisma.vendorPayment.aggregate({
    where: { vendorId: vendor.id, status: 'PAID', paidAt: { gte: monthStart } },
    _sum: { amount: true },
  });

  const pendingPayments = await prisma.vendorPayment.aggregate({
    where: { vendorId: vendor.id, status: 'PENDING' },
    _sum: { amount: true },
  });

  return {
    vendor,
    stats: {
      monthlyEarnings: monthlyEarnings._sum.amount || 0,
      pendingPayments: pendingPayments._sum.amount || 0,
    },
  };
}

export async function activateSubscription(vendorId: string, months: number, paymentProof?: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw Object.assign(new Error('Vendor not found'), { status: 404 });

  const startDate = new Date();
  const endDate = addMonths(startDate, months);

  const [updatedVendor] = await prisma.$transaction([
    prisma.vendor.update({
      where: { id: vendorId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: startDate,
        subscriptionEnd: endDate,
      },
    }),
    prisma.subscriptionPayment.create({
      data: {
        vendorId,
        amount: vendor.monthlyFee.toNumber() * months,
        monthsCovered: months,
        paymentProof,
        status: 'PENDING',
        validFrom: startDate,
        validUntil: endDate,
      },
    }),
  ]);

  return updatedVendor;
}

export async function getEarnings(userId: string, period: 'month' | 'year' | 'all' = 'month') {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw Object.assign(new Error('Vendor not found'), { status: 404 });

  const now = new Date();
  let from: Date;

  if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    from = new Date(now.getFullYear(), 0, 1);
  } else {
    from = new Date(0);
  }

  const payments = await prisma.vendorPayment.findMany({
    where: { vendorId: vendor.id, status: 'PAID', paidAt: { gte: from } },
    orderBy: { paidAt: 'desc' },
  });

  const total = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  return { payments, total };
}

export async function listAvailableVendors(vendorType?: string, date?: Date) {
  return prisma.vendor.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      isAvailable: true,
      ...(vendorType ? { vendorType: vendorType as any } : {}),
      ...(date
        ? {
            NOT: {
              blockedDates: {
                has: date,
              },
            },
          }
        : {}),
    },
    include: {
      user: { select: { name: true, phone: true } },
    },
  });
}
