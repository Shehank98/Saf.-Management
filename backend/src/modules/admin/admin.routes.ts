import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import * as service from './admin.service';
import { checkPaymentDeadlines } from '../cron/payment-deadline.cron';
import { checkSafariCancellations } from '../cron/safari-cancellation.cron';
import { checkSubscriptionExpiry } from '../cron/subscription-expiry.cron';
import { successResponse } from '../../types';

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

export { router as adminRouter };
