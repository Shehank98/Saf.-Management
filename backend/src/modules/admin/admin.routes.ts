import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import * as service from './admin.service';
import { checkPaymentDeadlines } from '../cron/payment-deadline.cron';
import { checkSafariCancellations } from '../cron/safari-cancellation.cron';
import { checkSubscriptionExpiry } from '../cron/subscription-expiry.cron';
import { successResponse } from '../../types';
import { prisma } from '../../config/database';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/dashboard', wrap(async (_req: any, res: any) => {
  const stats = await service.getDashboardStats();
  res.json(successResponse(stats));
}));

router.get('/owners', wrap(async (req: any, res: any) => {
  const owners = await service.listOwners(req.query.status as string | undefined);
  res.json(successResponse(owners));
}));

router.post('/owners/:id/subscription', wrap(async (req: any, res: any) => {
  const owner = await service.activateOwnerSubscription(req.params.id, req.body.months, req.body.paymentProof);
  res.json(successResponse(owner, 'Subscription activated'));
}));

router.get('/vendors', wrap(async (req: any, res: any) => {
  const vendors = await service.listVendors(req.query.vendorType as string, req.query.status as string);
  res.json(successResponse(vendors));
}));

router.get('/commissions', wrap(async (req: any, res: any) => {
  const commissions = await service.getCommissions(req.query.status as string | undefined);
  res.json(successResponse(commissions));
}));

router.get('/analytics', wrap(async (req: any, res: any) => {
  const data = await service.getAnalytics((req.query.period as 'week' | 'month' | 'year') || 'month');
  res.json(successResponse(data));
}));

// ==================== USER APPROVAL ====================

router.get('/users/pending', wrap(async (_req: any, res: any) => {
  const users = await service.getPendingUsers();
  res.json(successResponse(users));
}));

router.get('/users', wrap(async (_req: any, res: any) => {
  const users = await service.getAllUsers();
  res.json(successResponse(users));
}));

router.patch('/users/:id/approve', wrap(async (req: any, res: any) => {
  const user = await service.approveUser(req.params.id);
  res.json(successResponse(user, 'User approved'));
}));

router.patch('/users/:id/reject', wrap(async (req: any, res: any) => {
  const user = await service.rejectUser(req.params.id, req.body.note);
  res.json(successResponse(user, 'User rejected'));
}));

// ==================== FEATURE MANAGEMENT ====================

router.get('/users/:id/features', wrap(async (req: any, res: any) => {
  const features = await service.getUserFeatures(req.params.id);
  res.json(successResponse(features));
}));

router.patch('/users/:id/features', wrap(async (req: any, res: any) => {
  const features = await service.setUserFeatures(req.params.id, req.body.features);
  res.json(successResponse(features, 'Features updated'));
}));

// ==================== CRON TRIGGERS ====================

router.post('/cron/payment-deadlines', wrap(async (_req: any, res: any) => {
  await checkPaymentDeadlines();
  res.json(successResponse(null, 'Completed'));
}));

router.post('/cron/safari-cancellations', wrap(async (_req: any, res: any) => {
  await checkSafariCancellations();
  res.json(successResponse(null, 'Completed'));
}));

router.post('/cron/subscription-expiry', wrap(async (_req: any, res: any) => {
  await checkSubscriptionExpiry();
  res.json(successResponse(null, 'Completed'));
}));

// ==================== LOCATION MANAGEMENT ====================

router.get('/locations', wrap(async (_req: any, res: any) => {
  const locations = await prisma.location.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { owners: true, vendors: true } },
    },
  });
  res.json(successResponse(locations));
}));

router.post('/locations', wrap(async (req: any, res: any) => {
  const { name, description } = req.body;
  if (!name?.trim()) { res.status(400).json({ success: false, error: 'Name required' }); return; }
  const location = await prisma.location.create({
    data: { name: name.trim(), description: description?.trim() },
  });
  res.status(201).json(successResponse(location, 'Location created'));
}));

router.patch('/locations/:id', wrap(async (req: any, res: any) => {
  const { name, description, isActive } = req.body;
  const location = await prisma.location.update({
    where: { id: req.params.id },
    data: {
      ...(name        !== undefined ? { name: name.trim() }             : {}),
      ...(description !== undefined ? { description: description?.trim() } : {}),
      ...(isActive    !== undefined ? { isActive }                       : {}),
    },
  });
  res.json(successResponse(location, 'Location updated'));
}));

router.delete('/locations/:id', wrap(async (req: any, res: any) => {
  await prisma.location.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json(successResponse(null, 'Location deactivated'));
}));

// Get all safari owners with their assigned locations
router.get('/owners', wrap(async (_req: any, res: any) => {
  const owners = await prisma.safariOwner.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      locations: { include: { location: { select: { id: true, name: true } } } },
    },
    orderBy: { user: { name: 'asc' } },
  });
  res.json(successResponse(owners));
}));

// Replace all location assignments for an owner
router.put('/owners/:userId/locations', wrap(async (req: any, res: any) => {
  const { locationIds } = req.body as { locationIds: string[] };
  const owner = await prisma.safariOwner.findUnique({ where: { userId: req.params.userId } });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }

  await prisma.$transaction([
    prisma.safariOwnerLocation.deleteMany({ where: { ownerId: owner.id } }),
    ...(locationIds.length
      ? [prisma.safariOwnerLocation.createMany({
          data: locationIds.map((locationId) => ({ ownerId: owner.id, locationId })),
          skipDuplicates: true,
        })]
      : []),
  ]);

  res.json(successResponse(null, 'Owner locations updated'));
}));

export { router as adminRouter };
