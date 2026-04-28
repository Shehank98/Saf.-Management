import { getStripe } from '../../config/stripe';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export async function createPaymentIntent(bookingId: string, amount: number, currency = 'lkr') {
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses smallest currency unit
    currency,
    metadata: { bookingId },
  });

  return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
}

export async function refundBooking(bookingId: string): Promise<{ refundId: string }> {
  const stripe = getStripe();

  const booking = await prisma.sharedSafariBooking.findUnique({
    where: { id: bookingId },
    select: { paymentId: true, status: true },
  });

  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.status !== 'PAID') throw Object.assign(new Error('Only PAID bookings can be refunded'), { status: 400 });
  if (!booking.paymentId) throw Object.assign(new Error('No payment ID on record — was this paid via Stripe?'), { status: 400 });

  const refund = await stripe.refunds.create({ payment_intent: booking.paymentId });

  await prisma.sharedSafariBooking.update({
    where: { id: bookingId },
    data: { status: 'REFUNDED' },
  });

  logger.info(`Refunded booking ${bookingId} — Stripe refund ${refund.id}`);
  return { refundId: refund.id };
}

export async function handleWebhook(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed');
    throw Object.assign(new Error('Invalid webhook signature'), { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    const bookingId = paymentIntent.metadata.bookingId;

    if (bookingId) {
      await prisma.sharedSafariBooking.updateMany({
        where: { id: bookingId, status: 'PAYMENT_PENDING' },
        data: { status: 'PAID', paidAt: new Date(), paymentId: paymentIntent.id },
      });

      const booking = await prisma.sharedSafariBooking.findUnique({ where: { id: bookingId } });
      if (booking) {
        const paidCount = await prisma.sharedSafariBooking.count({
          where: { jeepId: booking.jeepId, status: 'PAID' },
        });

        if (paidCount >= 4) {
          await prisma.sharedJeep.update({
            where: { id: booking.jeepId },
            data: { status: 'CONFIRMED', paidSeats: paidCount },
          });
        } else {
          await prisma.sharedJeep.update({
            where: { id: booking.jeepId },
            data: { paidSeats: paidCount },
          });
        }
      }
    }
  }

  return { received: true };
}
