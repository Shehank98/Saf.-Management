import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, AuthRequest } from '../../types';
import { autoScheduleJeeps } from '../shared-safaris/shared-safari.service';

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

  const [upcomingShared, upcomingPrivate, monthRevenue, pendingVendorPayments, completedSharedThisMonth] = await Promise.all([
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
    // Safaris that reached 4+ paid seats (CONFIRMED or COMPLETED) this month
    prisma.sharedJeep.count({
      where: {
        ownerId: owner.id,
        safariDate: { gte: monthStart },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
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
      completedSharedThisMonth,
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

  // Shared safari vendor payments (existing)
  const sharedCondition = {
    vendor: {
      OR: [
        { jeepAssignments: { some: { sharedJeep: { ownerId: owner.id } } } },
        { guideAssignments: { some: { sharedJeep: { ownerId: owner.id } } } },
      ],
    },
  };

  // Private safari vendor payments (relatedSafariId set by assignVendors)
  const ownerPrivateSafariIds = await prisma.privateSafari.findMany({
    where: { ownerId: owner.id },
    select: { id: true },
  });
  const safariIds = ownerPrivateSafariIds.map((s) => s.id);

  const privateCondition = safariIds.length > 0
    ? { relatedSafariId: { in: safariIds } }
    : null;

  const payments = await prisma.vendorPayment.findMany({
    where: {
      OR: [
        sharedCondition,
        ...(privateCondition ? [privateCondition] : []),
      ],
    },
    include: { vendor: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(successResponse(payments));
}));

router.get('/locations', wrap(async (req: AuthRequest, res: any) => {
  const owner = await prisma.safariOwner.findUnique({
    where: { userId: req.user!.userId },
    include: { locations: { include: { location: { select: { id: true, name: true } } } } },
  });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }
  res.json(successResponse(owner.locations.map((l) => l.location)));
}));

router.post('/vendor-payments/:id/mark-paid', wrap(async (_req: any, res: any) => {
  const payment = await prisma.vendorPayment.update({
    where: { id: _req.params.id },
    data: { status: 'PAID', paidAt: new Date() },
  });
  res.json(successResponse(payment, 'Payment marked as paid'));
}));

// ==================== PRICING & PORTAL LINK ====================

router.get('/pricing', wrap(async (req: AuthRequest, res: any) => {
  const owner = await prisma.safariOwner.findUnique({
    where: { userId: req.user!.userId },
    select: { userId: true, priceFullDay: true, priceHalfDayMorning: true, priceHalfDayAfternoon: true, mealPrice: true },
  });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }
  const webAppUrl = process.env.WEB_APP_URL || process.env.APP_URL || '';
  res.json(successResponse({
    priceFullDay:          owner.priceFullDay,
    priceHalfDayMorning:   owner.priceHalfDayMorning,
    priceHalfDayAfternoon: owner.priceHalfDayAfternoon,
    mealPrice:             owner.mealPrice,
    ownerId:               owner.userId,
    portalUrl: `${webAppUrl}/book?owner=${owner.userId}`,
  }));
}));

router.put('/pricing', wrap(async (req: AuthRequest, res: any) => {
  const { priceFullDay, priceHalfDayMorning, priceHalfDayAfternoon, mealPrice } = req.body;
  const toNum = (v: any) => (v !== undefined && v !== '' ? parseFloat(v) : undefined);

  const owner = await prisma.safariOwner.update({
    where: { userId: req.user!.userId },
    data: {
      ...(toNum(priceFullDay)          !== undefined ? { priceFullDay:          toNum(priceFullDay) }          : {}),
      ...(toNum(priceHalfDayMorning)   !== undefined ? { priceHalfDayMorning:   toNum(priceHalfDayMorning) }   : {}),
      ...(toNum(priceHalfDayAfternoon) !== undefined ? { priceHalfDayAfternoon: toNum(priceHalfDayAfternoon) } : {}),
      ...(mealPrice !== undefined ? { mealPrice: mealPrice !== '' ? parseFloat(mealPrice) : null } : {}),
    },
    select: { id: true, userId: true, priceFullDay: true, priceHalfDayMorning: true, priceHalfDayAfternoon: true, mealPrice: true },
  });

  const created = await autoScheduleJeeps(owner.id, {
    priceFullDay:          owner.priceFullDay ? parseFloat(owner.priceFullDay.toString()) : null,
    priceHalfDayMorning:   owner.priceHalfDayMorning ? parseFloat(owner.priceHalfDayMorning.toString()) : null,
    priceHalfDayAfternoon: owner.priceHalfDayAfternoon ? parseFloat(owner.priceHalfDayAfternoon.toString()) : null,
  });

  const webAppUrl = process.env.WEB_APP_URL || process.env.APP_URL || '';
  res.json(successResponse({
    priceFullDay:          owner.priceFullDay,
    priceHalfDayMorning:   owner.priceHalfDayMorning,
    priceHalfDayAfternoon: owner.priceHalfDayAfternoon,
    mealPrice:             owner.mealPrice,
    ownerId:               owner.userId,
    portalUrl: `${webAppUrl}/book?owner=${owner.userId}`,
    jeepsCreated: created,
  }, `Pricing saved. ${created} new jeep slots scheduled.`));
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
