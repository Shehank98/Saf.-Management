import { prisma } from '../../config/database';
import { addMonths } from '../../utils/date-helpers';

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOwners,
    activeOwners,
    totalVendors,
    activeVendors,
    sharedSafaris,
    privateSafaris,
    revenue,
    pendingCommissions,
  ] = await Promise.all([
    prisma.safariOwner.count(),
    prisma.safariOwner.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.vendor.count(),
    prisma.vendor.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.sharedJeep.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.privateSafari.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.superAdminCommission.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { commissionAmount: true },
    }),
    prisma.superAdminCommission.aggregate({
      where: { status: 'PENDING' },
      _sum: { commissionAmount: true },
    }),
  ]);

  return {
    owners: { total: totalOwners, active: activeOwners },
    vendors: { total: totalVendors, active: activeVendors },
    safaris: { shared: sharedSafaris, private: privateSafaris },
    revenue: {
      thisMonth: revenue._sum.commissionAmount || 0,
      pending: pendingCommissions._sum.commissionAmount || 0,
    },
  };
}

export async function listOwners(status?: string) {
  return prisma.safariOwner.findMany({
    where: status ? { subscriptionStatus: status as any } : {},
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      ownerPayments: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function activateOwnerSubscription(
  ownerId: string,
  months: number,
  paymentProof?: string
) {
  const owner = await prisma.safariOwner.findUnique({ where: { id: ownerId } });
  if (!owner) throw Object.assign(new Error('Owner not found'), { status: 404 });

  const startDate = new Date();
  const endDate = addMonths(startDate, months);

  const [updated] = await prisma.$transaction([
    prisma.safariOwner.update({
      where: { id: ownerId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: startDate,
        subscriptionEnd: endDate,
        subscriptionMonths: months,
      },
    }),
    prisma.ownerSubscriptionPayment.create({
      data: {
        ownerId,
        amount: parseFloat(owner.monthlyFee.toString()) * months,
        monthsCovered: months,
        paymentProof,
        status: 'PAID',
        paidAt: new Date(),
        validFrom: startDate,
        validUntil: endDate,
      },
    }),
  ]);

  return updated;
}

export async function listVendors(vendorType?: string, status?: string) {
  return prisma.vendor.findMany({
    where: {
      ...(vendorType ? { vendorType: vendorType as any } : {}),
      ...(status ? { subscriptionStatus: status as any } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCommissions(status?: string) {
  return prisma.superAdminCommission.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAnalytics(period: 'week' | 'month' | 'year' = 'month') {
  const now = new Date();
  let from: Date;

  if (period === 'week') {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }

  const [sharedByStatus, privateByStatus, subscriptionRevenue] = await Promise.all([
    prisma.sharedJeep.groupBy({
      by: ['status'],
      where: { createdAt: { gte: from } },
      _count: true,
    }),
    prisma.privateSafari.groupBy({
      by: ['status'],
      where: { createdAt: { gte: from } },
      _count: true,
    }),
    prisma.ownerSubscriptionPayment.aggregate({
      where: { status: 'PAID', paidAt: { gte: from } },
      _sum: { amount: true },
    }),
  ]);

  return { sharedByStatus, privateByStatus, subscriptionRevenue: subscriptionRevenue._sum.amount || 0 };
}
