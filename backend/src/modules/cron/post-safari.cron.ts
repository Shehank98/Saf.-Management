import { prisma } from '../../config/database';
import { sendWhatsApp } from '../notifications/whatsapp.service';
import { logger } from '../../utils/logger';
import { addHours } from '../../utils/date-helpers';

export async function checkPreSafariReminders(): Promise<void> {
  logger.info('Running pre-safari reminder check...');
  const now = new Date();
  const windowStart = addHours(now, 23);
  const windowEnd = addHours(now, 25);

  const jeepsToRemind = await prisma.sharedJeep.findMany({
    where: {
      safariDate: { gte: windowStart, lte: windowEnd },
      status: 'CONFIRMED',
      reminderSent: false,
    },
    include: {
      bookings: {
        where: { status: 'PAID' },
        include: { customer: { include: { user: true } } },
      },
      guideAssignment: { include: { vendor: { include: { user: { select: { name: true } } } } } },
      jeepAssignment: true,
    },
  });

  for (const jeep of jeepsToRemind) {
    try {
      await prisma.sharedJeep.update({ where: { id: jeep.id }, data: { reminderSent: true } });

      const guideName = jeep.guideAssignment?.vendor?.user?.name || 'TBD';
      const jeepNumber = jeep.jeepAssignment?.jeepNumber || 'TBD';

      for (const booking of jeep.bookings) {
        await sendWhatsApp({
          to: booking.customer.user.phone,
          template: 'safari_reminder_24h',
          recipientId: booking.customer.userId,
          data: {
            date: jeep.safariDate.toDateString(),
            safariType: jeep.safariType,
            pickupTime: booking.pickupTime,
            guideName,
            jeepNumber,
          },
        }).catch(() => {});
      }

      logger.info(`24h reminder sent for jeep ${jeep.id} (${jeep.bookings.length} customers)`);
    } catch (err) {
      logger.error(`Failed to send reminder for jeep ${jeep.id}:`, err);
    }
  }
}

export async function checkPostSafariReviews(): Promise<void> {
  logger.info('Running post-safari review request check...');
  const now = new Date();

  // Find CONFIRMED jeeps where safari has ended 6–8 hours ago (review request window)
  // Safari ended ≈ safariDate + duration; we want to trigger 6h after end.
  // Trigger window: safariDate is between [now - duration - 8h] and [now - duration - 6h]
  // Use default 8h duration for simplicity
  const reviewTriggerStart = addHours(now, -(8 + 8)); // now - 16h
  const reviewTriggerEnd = addHours(now, -(8 + 6));   // now - 14h

  const jeepsForReview = await prisma.sharedJeep.findMany({
    where: {
      safariDate: { gte: reviewTriggerStart, lte: reviewTriggerEnd },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      reviewRequestSent: false,
    },
    include: {
      bookings: {
        where: { status: 'PAID' },
        include: { customer: { include: { user: true } } },
      },
    },
  });

  const platformReviewLink = process.env.GOOGLE_REVIEW_LINK || 'https://g.page/r/your-review-link';

  for (const jeep of jeepsForReview) {
    try {
      await prisma.sharedJeep.update({
        where: { id: jeep.id },
        data: { status: 'COMPLETED', reviewRequestSent: true },
      });

      for (const booking of jeep.bookings) {
        await sendWhatsApp({
          to: booking.customer.user.phone,
          template: 'review_request',
          recipientId: booking.customer.userId,
          data: {
            customerName: booking.customer.user.name,
            date: jeep.safariDate.toDateString(),
            reviewLink: platformReviewLink,
          },
        }).catch(() => {});
      }

      logger.info(`Review requests sent for jeep ${jeep.id} (${jeep.bookings.length} customers)`);
    } catch (err) {
      logger.error(`Failed to send review request for jeep ${jeep.id}:`, err);
    }
  }

  // Private safari review requests — use the owner's Google review link
  const privateSafariReviewStart = addHours(now, -(8 + 8));
  const privateSafariReviewEnd   = addHours(now, -(8 + 6));

  const privateSafarisForReview = await prisma.privateSafari.findMany({
    where: {
      safariDate: { gte: privateSafariReviewStart, lte: privateSafariReviewEnd },
      status: 'COMPLETED',
    },
    include: {
      owner: { select: { googleReviewLink: true } },
      booking: { include: { customer: { include: { user: { select: { name: true, phone: true, id: true } } } } } },
    },
  });

  for (const safari of privateSafarisForReview) {
    try {
      const reviewLink = (safari.owner as any).googleReviewLink || platformReviewLink;
      const phone = safari.customerPhone || safari.booking?.customer?.user?.phone;
      const name  = safari.customerName  || safari.booking?.customer?.user?.name || 'Valued Customer';
      const customerId = safari.booking?.customer?.userId;

      if (!phone) continue;

      await sendWhatsApp({
        to: phone,
        template: 'review_request',
        recipientId: customerId,
        data: {
          customerName: name,
          date: safari.safariDate.toDateString(),
          reviewLink,
        },
      }).catch(() => {});

      logger.info(`Private safari review request sent for safari ${safari.id}`);
    } catch (err) {
      logger.error(`Failed to send private safari review for ${safari.id}:`, err);
    }
  }
}
