import Stripe from 'stripe';
import { prisma } from '../../config/database';
import { sendWhatsApp } from '../notifications/whatsapp.service';
import { logger } from '../../utils/logger';
import { addHours } from '../../utils/date-helpers';

export async function checkSafariCancellations(): Promise<void> {
  logger.info('Running safari cancellation check...');
  const now = new Date();
  const cutoff = addHours(now, 24);

  const jeepsToCancel = await prisma.sharedJeep.findMany({
    where: {
      safariDate: { gte: now, lte: cutoff },
      paidSeats: { lt: 4 },
      status: { in: ['OPEN', 'PENDING_PAYMENT'] },
    },
    include: {
      bookings: {
        where: { status: { in: ['RESERVED', 'PAYMENT_PENDING', 'PAID'] } },
        include: { customer: { include: { user: true } } },
      },
      owner: { include: { user: true } },
    },
  });

  for (const jeep of jeepsToCancel) {
    try {
      await prisma.sharedJeep.update({
        where: { id: jeep.id },
        data: { status: 'CANCELLED' },
      });

      for (const booking of jeep.bookings) {
        if (booking.status === 'PAID' && booking.paymentId) {
          await processRefund(booking.id, booking.paymentId).catch((err) =>
            logger.error(`Refund failed for booking ${booking.id}:`, err)
          );
        }

        await prisma.sharedSafariBooking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED' },
        });

        await sendWhatsApp({
          to: booking.customer.user.phone,
          template: 'safari_cancelled',
          recipientId: booking.customer.userId,
          data: {
            bookingId: booking.id,
            date: jeep.safariDate.toDateString(),
            refundAmount: booking.totalAmount,
            reason: 'Minimum 4 guests required',
          },
        }).catch(() => {});
      }

      await sendWhatsApp({
        to: jeep.owner.user.phone,
        template: 'safari_cancelled',
        recipientId: jeep.owner.userId,
        data: {
          bookingId: jeep.id,
          date: jeep.safariDate.toDateString(),
          refundAmount: 0,
          reason: `Auto-cancelled: only ${jeep.paidSeats} paid seats`,
        },
      }).catch(() => {});

      logger.info(`Cancelled jeep ${jeep.id} for ${jeep.safariDate.toDateString()}`);
    } catch (err) {
      logger.error(`Failed to cancel jeep ${jeep.id}:`, err);
    }
  }
}

async function processRefund(bookingId: string, paymentId: string): Promise<void> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
  await stripe.refunds.create({ payment_intent: paymentId });
  await prisma.sharedSafariBooking.update({
    where: { id: bookingId },
    data: { status: 'REFUNDED' },
  });
}
