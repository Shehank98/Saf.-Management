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
    pendingUsers,
    sharedSafaris,
    privateSafaris,
    revenue,
    pendingCommissions,
  ] = await Promise.all([
    prisma.safariOwner.count(),
    prisma.safariOwner.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.vendor.count(),
    prisma.vendor.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.user.count({ where: { approvalStatus: 'PENDING', role: { in: ['SAFARI_OWNER', 'VENDOR'] } } }),
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
    pendingApprovals: pendingUsers,
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
      user: { select: { id: true, name: true, email: true, phone: true, approvalStatus: true } },
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
      user: { select: { id: true, name: true, email: true, phone: true, approvalStatus: true } },
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

// ==================== USER MANAGEMENT ====================

export async function getPendingUsers() {
  return prisma.user.findMany({
    where: { approvalStatus: 'PENDING', role: { in: ['SAFARI_OWNER', 'VENDOR'] } },
    include: {
      vendor: { select: { businessName: true, vendorType: true, businessAddress: true } },
      safariOwner: { select: { companyName: true, companyAddress: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    where: { role: { in: ['SAFARI_OWNER', 'VENDOR'] } },
    include: {
      vendor: { select: { businessName: true, vendorType: true } },
      safariOwner: { select: { companyName: true } },
      features: { select: { feature: true, enabled: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return prisma.user.update({
    where: { id: userId },
    data: { approvalStatus: 'APPROVED', approvedAt: new Date(), approvalNote: null },
  });
}

export async function rejectUser(userId: string, note?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return prisma.user.update({
    where: { id: userId },
    data: { approvalStatus: 'REJECTED', approvalNote: note || 'Rejected by admin' },
  });
}

export async function getUserFeatures(userId: string) {
  return prisma.userFeature.findMany({ where: { userId } });
}

export async function setUserFeatures(
  userId: string,
  features: { feature: string; enabled: boolean }[]
) {
  const ops = features.map((f) =>
    prisma.userFeature.upsert({
      where: { userId_feature: { userId, feature: f.feature as any } },
      create: { userId, feature: f.feature as any, enabled: f.enabled },
      update: { enabled: f.enabled },
    })
  );
  return prisma.$transaction(ops);
}
