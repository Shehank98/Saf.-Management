import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import * as ctrl from './shared-safari.controller';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Public
router.get('/available-dates', wrap(ctrl.getAvailableDates));
router.get('/jeeps/:date/:type', wrap(ctrl.getJeepsByDate));
router.get('/booking/:bookingId', wrap(ctrl.getBooking));

// Customer
router.post('/validate-location', wrap(ctrl.validateLocation));
router.post('/reserve-seat', authenticate, requireRole('CUSTOMER'), wrap(ctrl.reserveSeat));
router.post('/payment/confirm/:bookingId', wrap(ctrl.confirmPayment));

// Owner
router.post('/jeeps', authenticate, requireRole('SAFARI_OWNER'), wrap(ctrl.createJeep));
router.get('/owner/jeeps', authenticate, requireRole('SAFARI_OWNER'), wrap(ctrl.getOwnerJeeps));
router.patch('/jeeps/:jeepId/assign-vendors', authenticate, requireRole('SAFARI_OWNER'), wrap(ctrl.assignVendors));

export { router as sharedSafariRouter };
