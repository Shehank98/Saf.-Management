import { Router, raw } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { createPaymentIntent, handleWebhook } from './stripe.service';
import { successResponse, errorResponse } from '../../types';
import { prisma } from '../../config/database';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Public — used by the WhatsApp /pay/:bookingId link (no auth required)
router.post(
  '/public-intent/:bookingId',
  wrap(async (req: any, res: any) => {
    const booking = await prisma.sharedSafariBooking.findUnique({
      where: { id: req.params.bookingId },
      select: { id: true, totalAmount: true, status: true },
    });
    if (!booking) { res.status(404).json(errorResponse('Booking not found')); return; }
    if (booking.status !== 'PAYMENT_PENDING') {
      res.status(400).json(errorResponse(`Booking is already ${booking.status}`)); return;
    }
    const result = await createPaymentIntent(booking.id, parseFloat(booking.totalAmount.toString()));
    res.json(successResponse(result));
  })
);

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
