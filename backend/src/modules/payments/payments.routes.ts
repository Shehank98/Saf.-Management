import { Router, raw } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { createPaymentIntent, handleWebhook } from './stripe.service';
import { successResponse } from '../../types';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post(
  '/shared-safari/create-intent/:bookingId',
  authenticate,
  requireRole('CUSTOMER'),
  wrap(async (req: any, res: any) => {
    const { bookingId } = req.params;
    const { amount } = req.body;
    const result = await createPaymentIntent(bookingId, amount);
    res.json(successResponse(result));
  })
);

// Raw body needed for Stripe webhook signature verification
router.post(
  '/webhook/stripe',
  raw({ type: 'application/json' }),
  wrap(async (req: any, res: any) => {
    const sig = req.headers['stripe-signature'];
    const result = await handleWebhook(req.body, sig);
    res.json(result);
  })
);

export { router as paymentsRouter };
