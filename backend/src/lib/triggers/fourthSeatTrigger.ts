import { prisma } from '../../config/database';
import { sendWhatsApp } from '../../modules/notifications/whatsapp.service';
import { logger } from '../../utils/logger';
import { addHours } from '../../utils/date-helpers';

const PAYMENT_WINDOW_HOURS = 24;
const MIN_SEATS = 4;

const SL_LOCALE: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Colombo',
  dateStyle: 'medium',
  timeStyle: 'short',
};

const DATE_LOCALE: Intl.DateTimeFormatOptions = {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
};

/**
 * Fires when the 4th seat on a shared jeep is reserved.
 *
 * Steps:
 *  1. Mark jeep PENDING_PAYMENT + set 24-hour deadline
 *  2. Move every RESERVED booking → PAYMENT_PENDING + stamp paymentLinkSent
 *  3. Send each customer their personal WhatsApp payment request
 *  4. Send the owner a WhatsApp summary (status, guest list, revenue, deadline)
 *  5. Auto-create a fresh overflow jeep for the same date/type
 */
export async function onFourthSeatReserved(jeepId: string): Promise<void> {
  const deadline = addHours(new Date(), PAYMENT_WINDOW_HOURS);

  const jeep = await prisma.sharedJeep.findUnique({
    where: { id: jeepId },
    include: {
      owner: { include: { user: { select: { id: true, name: true, phone: true } } } },
      bookings: {
        where: { status: 'RESERVED' },
        include: { customer: { include: { user: { select: { id: true, name: true, phone: true } } } } },
        orderBy: { seatNumber: 'asc' },
      },
    },
  });

  if (!jeep) {
    logger.error(`onFourthSeatReserved: jeep ${jeepId} not found`);
    return;
  }

  if (jeep.bookings.length < MIN_SEATS) {
    logger.warn(`onFourthSeatReserved: jeep ${jeepId} only has ${jeep.bookings.length} RESERVED bookings — skipping`);
    return;
  }

  // ── 1. Mark jeep PENDING_PAYMENT ─────────────────────────────────────────
  await prisma.sharedJeep.update({
    where: { id: jeepId },
    data: { status: 'PENDING_PAYMENT', paymentDeadline: deadline },
  });

  const webAppUrl = process.env.WEB_APP_URL || 'https://your-app.up.railway.app';
  const deadlineStr = deadline.toLocaleString('en-US', SL_LOCALE);
  const safariDateStr = jeep.safariDate.toLocaleDateString('en-US', DATE_LOCALE);

  let expectedRevenue = 0;
  const guestLines: string[] = [];

  // ── 2 & 3. Update each booking + send customer WhatsApp ──────────────────
  for (const booking of jeep.bookings) {
    const paymentLink = `${webAppUrl}/pay/${booking.id}`;
    const amount = parseFloat(booking.totalAmount.toString());
    expectedRevenue += amount;

    await prisma.sharedSafariBooking.update({
      where: { id: booking.id },
      data: {
        status: 'PAYMENT_PENDING',
        paymentDeadline: deadline,
        paymentLinkSent: new Date(),
      },
    });

    guestLines.push(`Seat ${booking.seatNumber} · ${booking.customer.user.name} · LKR ${amount.toFixed(0)}`);

    await sendWhatsApp({
      to: booking.customer.user.phone,
      template: 'payment_request',
      recipientId: booking.customer.user.id,
      data: {
        customerName: booking.customer.user.name,
        date: safariDateStr,
        safariType: jeep.safariType,
        seatNumber: booking.seatNumber,
        amount,
        deadline: deadlineStr,
        paymentLink,
      },
    }).catch((err) =>
      logger.error(`Customer WhatsApp failed (booking ${booking.id}):`, err)
    );
  }

  logger.info(
    `[4th-seat] Payment links sent to ${jeep.bookings.length} customers for jeep ${jeepId}`
  );

  // ── 4. Notify owner ───────────────────────────────────────────────────────
  const ownerPhone = jeep.owner.user.phone;
  if (ownerPhone) {
    const dashboardLink = `${webAppUrl}/owner/dashboard`;

    await sendWhatsApp({
      to: ownerPhone,
      template: 'owner_safari_payment_alert',
      recipientId: jeep.owner.user.id,
      data: {
        ownerName: jeep.owner.user.name,
        date: safariDateStr,
        safariType: jeep.safariType,
        guestCount: jeep.bookings.length,
        expectedRevenue: expectedRevenue.toFixed(0),
        deadline: deadlineStr,
        guestSummary: guestLines.join('\n'),
        dashboardLink,
      },
    }).catch((err) =>
      logger.error(`Owner WhatsApp failed for jeep ${jeepId}:`, err)
    );

    logger.info(
      `[4th-seat] Owner notified — jeep ${jeepId} | LKR ${expectedRevenue} expected`
    );
  }

  // ── 5. Auto-create overflow jeep ─────────────────────────────────────────
  await autoCreateOverflowJeep(jeep).catch((err) =>
    logger.error(`Auto-create overflow jeep failed for ${jeepId}:`, err)
  );
}

/**
 * Fires when a 5th or 6th seat is reserved on a jeep that is already
 * PENDING_PAYMENT. Sends the new customer their payment link immediately
 * using the deadline that was set for the original four.
 */
export async function onAdditionalSeatReserved(
  jeepId: string,
  bookingId: string,
): Promise<void> {
  const booking = await prisma.sharedSafariBooking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { include: { user: { select: { id: true, name: true, phone: true } } } },
      jeep: { select: { safariDate: true, safariType: true, paymentDeadline: true } },
    },
  });

  if (!booking) return;

  // Use the existing deadline if set; otherwise fall back to 24h from now
  const deadline = booking.jeep.paymentDeadline ?? addHours(new Date(), PAYMENT_WINDOW_HOURS);
  const webAppUrl = process.env.WEB_APP_URL || 'https://your-app.up.railway.app';
  const paymentLink = `${webAppUrl}/pay/${bookingId}`;
  const deadlineStr = deadline.toLocaleString('en-US', SL_LOCALE);
  const safariDateStr = booking.jeep.safariDate.toLocaleDateString('en-US', DATE_LOCALE);
  const amount = parseFloat(booking.totalAmount.toString());

  await prisma.sharedSafariBooking.update({
    where: { id: bookingId },
    data: {
      status: 'PAYMENT_PENDING',
      paymentDeadline: deadline,
      paymentLinkSent: new Date(),
    },
  });

  await sendWhatsApp({
    to: booking.customer.user.phone,
    template: 'payment_request',
    recipientId: booking.customer.user.id,
    data: {
      customerName: booking.customer.user.name,
      date: safariDateStr,
      safariType: booking.jeep.safariType,
      seatNumber: booking.seatNumber,
      amount,
      deadline: deadlineStr,
      paymentLink,
    },
  }).catch((err) =>
    logger.error(`Additional-seat WhatsApp failed (booking ${bookingId}):`, err)
  );

  logger.info(`[additional-seat] Payment link sent for booking ${bookingId}`);
}

async function autoCreateOverflowJeep(
  original: { ownerId: string; safariDate: Date; safariType: string; pricePerSeat: any; safariDeadline: Date },
): Promise<void> {
  const existing = await prisma.sharedJeep.findFirst({
    where: {
      ownerId: original.ownerId,
      safariDate: {
        gte: new Date(original.safariDate.toDateString()),
        lt: new Date(original.safariDate.getTime() + 86_400_000),
      },
      safariType: original.safariType,
      status: 'OPEN',
    },
    select: { id: true },
  });

  if (existing) {
    logger.info(`[4th-seat] Overflow jeep already exists — skipping auto-create`);
    return;
  }

  const { randomBytes } = await import('crypto');
  const token = randomBytes(16).toString('hex');

  const overflow = await prisma.sharedJeep.create({
    data: {
      ownerId: original.ownerId,
      safariDate: original.safariDate,
      safariType: original.safariType,
      pricePerSeat: original.pricePerSeat,
      safariDeadline: original.safariDeadline,
      bookingLinkToken: token,
    },
  });

  logger.info(`[4th-seat] Overflow jeep ${overflow.id} created for ${original.safariDate.toDateString()} ${original.safariType}`);
}
