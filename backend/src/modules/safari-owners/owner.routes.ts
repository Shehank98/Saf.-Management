import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, AuthRequest } from '../../types';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(authenticate, requireRole('SAFARI_OWNER'));

router.get('/dashboard', wrap(async (req: AuthRequest, res: any) => {
  const owner = await prisma.safariOwner.findUnique({
    where: { userId: req.user!.userId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [upcomingShared, upcomingPrivate, monthRevenue, pendingVendorPayments] = await Promise.all([
    prisma.sharedJeep.count({
      where: { ownerId: owner.id, safariDate: { gte: now }, status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'OPEN'] } },
    }),
    prisma.privateSafari.count({
      where: { ownerId: owner.id, safariDate: { gte: now }, status: { in: ['CONFIRMED', 'DEPOSIT_PAID'] } },
    }),
    prisma.sharedSafariBooking.aggregate({
      where: {
        jeep: { ownerId: owner.id },
        status: 'PAID',
        paidAt: { gte: monthStart },
      },
      _sum: { totalAmount: true },
    }),
    prisma.vendorPayment.count({
      where: {
        status: 'PENDING',
        vendor: {
          jeepAssignments: { some: { sharedJeep: { ownerId: owner.id } } },
        },
      },
    }),
  ]);

  res.json(successResponse({
    owner,
    stats: {
      upcomingShared,
      upcomingPrivate,
      monthRevenue: monthRevenue._sum.totalAmount || 0,
      pendingVendorPayments,
    },
  }));
}));

router.get('/revenue', wrap(async (req: AuthRequest, res: any) => {
  const owner = await prisma.safariOwner.findUnique({ where: { userId: req.user!.userId } });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }

  const payments = await prisma.sharedSafariBooking.findMany({
    where: { jeep: { ownerId: owner.id }, status: 'PAID' },
    select: { totalAmount: true, paidAt: true, jeep: { select: { safariDate: true, safariType: true } } },
    orderBy: { paidAt: 'desc' },
    take: 100,
  });

  res.json(successResponse(payments));
}));

router.get('/vendor-payments', wrap(async (req: AuthRequest, res: any) => {
  const owner = await prisma.safariOwner.findUnique({ where: { userId: req.user!.userId } });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }

  const payments = await prisma.vendorPayment.findMany({
    where: {
      vendor: {
        OR: [
          { jeepAssignments: { some: { sharedJeep: { ownerId: owner.id } } } },
          { guideAssignments: { some: { sharedJeep: { ownerId: owner.id } } } },
        ],
      },
    },
    include: { vendor: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(successResponse(payments));
}));

router.post('/vendor-payments/:id/mark-paid', wrap(async (_req: any, res: any) => {
  const payment = await prisma.vendorPayment.update({
    where: { id: _req.params.id },
    data: { status: 'PAID', paidAt: new Date() },
  });
  res.json(successResponse(payment, 'Payment marked as paid'));
}));

router.get('/subscription', wrap(async (req: AuthRequest, res: any) => {
  const owner = await prisma.safariOwner.findUnique({
    where: { userId: req.user!.userId },
    select: {
      subscriptionStatus: true,
      subscriptionStart: true,
      subscriptionEnd: true,
      monthlyFee: true,
    },
  });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }
  res.json(successResponse(owner));
}));

export { router as ownerRouter };
