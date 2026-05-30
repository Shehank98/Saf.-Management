import axios from 'axios';
import { prisma } from '../../config/database';
import { whatsappConfig } from '../../config/whatsapp';
import { logger } from '../../utils/logger';

interface WhatsAppMessage {
  to: string;
  template: string;
  data: Record<string, unknown>;
  recipientId?: string;
}

const TEMPLATES: Record<string, (data: Record<string, unknown>) => object> = {
  safari_confirmed: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.date },
          { type: 'text', text: data.safariType },
          { type: 'text', text: String(data.seatNumber) },
          { type: 'text', text: data.guideName || 'TBD' },
          { type: 'text', text: data.pickupTime },
        ],
      },
    ],
  }),
  payment_request: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.customerName) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.seatNumber) },
          { type: 'text', text: `LKR ${data.amount}` },
          { type: 'text', text: String(data.deadline) },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: String(data.paymentLink) }],
      },
    ],
  }),
  seat_released: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.bookingId) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.seatNumber) },
        ],
      },
    ],
  }),
  safari_cancelled: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.bookingId) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: `LKR ${data.refundAmount}` },
          { type: 'text', text: String(data.reason) },
        ],
      },
    ],
  }),
  subscription_expired: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.vendorName) },
          { type: 'text', text: String(data.renewalLink) },
        ],
      },
    ],
  }),
  subscription_expiring_soon: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.daysLeft) },
          { type: 'text', text: String(data.renewalLink) },
        ],
      },
    ],
  }),
  safari_reminder_24h: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.pickupTime) },
          { type: 'text', text: String(data.guideName) },
          { type: 'text', text: String(data.jeepNumber) },
        ],
      },
    ],
  }),
  review_request: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.customerName) },
          { type: 'text', text: String(data.date) },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: String(data.reviewLink) }],
      },
    ],
  }),
  booking_conflict_cancelled: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.cancelledDate) },
          { type: 'text', text: String(data.confirmedDate) },
        ],
      },
    ],
  }),

  // Private safari: sent to customer when status moves to DEPOSIT_PENDING
  private_safari_deposit_request: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.customerName) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.numberOfGuests) },
          { type: 'text', text: `LKR ${data.depositAmount}` },
        ],
      },
    ],
  }),

  // Private safari: sent to customer when status moves to CONFIRMED
  private_safari_confirmed: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.customerName) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.numberOfGuests) },
        ],
      },
    ],
  }),

  // Sent to customer for seats 1-3 before safari is confirmed
  booking_received_pending: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.customerName) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.seatNumber) },
          { type: 'text', text: `${data.currentBookings}/${data.totalSeats}` },
          { type: 'text', text: String(data.neededToConfirm) },
          { type: 'text', text: String(data.deadline) },
          { type: 'text', text: String(data.bookingId) },
        ],
      },
    ],
  }),

  // Sent to owner when safari is confirmed (4+ paid seats)
  owner_safari_confirmed: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.ownerName) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.paidSeats) },
          { type: 'text', text: String(data.totalSeats) },
          { type: 'text', text: String(data.remainingSeats) },
          { type: 'text', text: `LKR ${data.totalRevenue}` },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: String(data.dashboardLink) }],
      },
    ],
  }),

  // Sent to owner on 5th or 6th seat payment
  owner_safari_capacity_update: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.ownerName) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.paidSeats) },
          { type: 'text', text: String(data.totalSeats) },
          { type: 'text', text: String(data.remainingSeats) },
          { type: 'text', text: `LKR ${data.totalRevenue}` },
        ],
      },
    ],
  }),

  // Sent to owner when all 6 seats are paid
  owner_safari_fully_booked: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.ownerName) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: `LKR ${data.totalRevenue}` },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: String(data.dashboardLink) }],
      },
    ],
  }),

  // Sent to the safari owner when the 4th seat is reserved and payment is triggered
  owner_safari_payment_alert: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.ownerName) },
          { type: 'text', text: String(data.date) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.guestCount) },
          { type: 'text', text: `LKR ${data.expectedRevenue}` },
          { type: 'text', text: String(data.deadline) },
          { type: 'text', text: String(data.guestSummary) },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: String(data.dashboardLink) }],
      },
    ],
  }),

  vendor_job_assigned: (data) => ({
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(data.vendorName) },
          { type: 'text', text: String(data.safariDate) },
          { type: 'text', text: String(data.safariType) },
          { type: 'text', text: String(data.numberOfGuests) },
          { type: 'text', text: String(data.fee) },
          { type: 'text', text: String(data.specialRequirements || 'None') },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: String(data.dashboardLink) }],
      },
    ],
  }),
};

export async function sendWhatsApp({ to, template, data, recipientId }: WhatsAppMessage): Promise<void> {
  const templateConfig = TEMPLATES[template];
  if (!templateConfig) {
    logger.warn(`Unknown WhatsApp template: ${template}`);
    return;
  }

  const notificationData = {
    recipientId: recipientId || 'unknown',
    recipientPhone: to,
    type: 'WHATSAPP' as const,
    templateName: template,
    templateData: data as any,
    message: template,
  };

  try {
    await axios.post(
      `${whatsappConfig.apiUrl}/${whatsappConfig.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: 'en' },
          ...templateConfig(data),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await prisma.notification.create({
      data: { ...notificationData, status: 'SENT', sentAt: new Date() },
    });

    logger.info(`WhatsApp sent to ${to} template: ${template}`);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await prisma.notification.create({
      data: { ...notificationData, status: 'FAILED', failureReason: msg },
    });
    logger.error(`WhatsApp failed to ${to}:`, msg);
    throw error;
  }
}
