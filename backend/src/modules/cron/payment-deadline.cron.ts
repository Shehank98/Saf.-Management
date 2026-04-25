import { prisma } from '../../config/database';
import { sendWhatsApp } from '../notifications/whatsapp.service';
import { logger } from '../../utils/logger';

export async function checkPaymentDeadlines(): Promise<void> {
  logger.info('Running payment deadline check...');
  const now = new Date();

  const expiredBookings = await prisma.sharedSafariBooking.findMany({
    where: {
      status: 'PAYMENT_PENDING',
      paymentDeadline: { lte: now },
    },
    include: {
      customer: { include: { user: true } },
      jeep: true,
    },
  });

  for (const booking of expiredBookings) {
    try {
      await prisma.$transaction([
        prisma.sharedSafariBooking.update({
          where: { id: booking.id },
          data: { status: 'RELEASED' },
        }),
        prisma.sharedJeep.update({
          where: { id: booking.jeepId },
          data: { reservedSeats: { decrement: 1 } },
        }),
      ]);

      await sendWhatsApp({
        to: booking.customer.user.phone,
        template: 'seat_released',
        recipientId: booking.customer.userId,
        data: {
          bookingId: booking.id,
          date: booking.jeep.safariDate.toDateString(),
          seatNumber: booking.seatNumber,
        },
      }).catch(() => {});

      logger.info(`Released seat ${booking.seatNumber} from booking ${booking.id}`);
    } catch (err) {
      logger.error(`Failed to release booking ${booking.id}:`, err);
    }
  }

  if (expiredBookings.length > 0) {
    const affectedJeepIds = [...new Set(expiredBookings.map((b) => b.jeepId))];
    for (const jeepId of affectedJeepIds) {
      await reEvaluateJeepStatus(jeepId);
    }
  }
}

async function reEvaluateJeepStatus(jeepId: string): Promise<void> {
  const jeep = await prisma.sharedJeep.findUnique({
    where: { id: jeepId },
    include: { bookings: { where: { status: 'PAID' } } },
  });

  if (!jeep) return;

  const paidCount = jeep.bookings.length;

  if (paidCount < 4 && jeep.status === 'CONFIRMED') {
    await prisma.sharedJeep.update({
      where: { id: jeepId },
      data: { status: 'PENDING_PAYMENT', paidSeats: paidCount },
    });
  }
}
