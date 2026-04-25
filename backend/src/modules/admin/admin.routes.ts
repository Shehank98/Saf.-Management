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

// Internal cron trigger endpoints
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
