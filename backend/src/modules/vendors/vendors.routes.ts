import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import * as ctrl from './vendors.controller';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/available', authenticate, requireRole('SAFARI_OWNER', 'SUPER_ADMIN'), wrap(ctrl.listAvailable));
router.use(authenticate, requireRole('VENDOR'));
router.get('/profile', wrap(ctrl.getProfile));
router.get('/dashboard', wrap(ctrl.getDashboard));
router.get('/earnings', wrap(ctrl.getEarnings));
router.get('/jobs', wrap(ctrl.getJobs));
router.patch('/availability', wrap(ctrl.updateAvailability));
router.post('/subscription/pay', wrap(ctrl.paySubscription));

export { router as vendorRouter };
