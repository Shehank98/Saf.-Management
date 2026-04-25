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
