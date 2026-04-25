import { prisma } from '../../config/database';
import { sendWhatsApp } from '../notifications/whatsapp.service';
import { logger } from '../../utils/logger';
import { addDays } from '../../utils/date-helpers';

export async function checkSubscriptionExpiry(): Promise<void> {
  logger.info('Running subscription expiry check...');
  const now = new Date();
  const warningDate = addDays(now, 7);
  const appUrl = process.env.APP_URL || 'https://safari.lk';

  // Expire vendors
  const expiredVendors = await prisma.vendor.findMany({
    where: { subscriptionEnd: { lte: now }, subscriptionStatus: 'ACTIVE' },
    include: { user: true },
  });

  for (const vendor of expiredVendors) {
    await prisma.vendor.update({ where: { id: vendor.id }, data: { subscriptionStatus: 'EXPIRED' } });
    await sendWhatsApp({
      to: vendor.user.phone,
      template: 'subscription_expired',
      recipientId: vendor.userId,
      data: { vendorName: vendor.businessName, renewalLink: `${appUrl}/vendor/renew` },
    }).catch(() => {});
  }

  // Expire owners
  const expiredOwners = await prisma.safariOwner.findMany({
    where: { subscriptionEnd: { lte: now }, subscriptionStatus: 'ACTIVE' },
    include: { user: true },
  });

  for (const owner of expiredOwners) {
    await prisma.safariOwner.update({ where: { id: owner.id }, data: { subscriptionStatus: 'EXPIRED' } });
    await sendWhatsApp({
      to: owner.user.phone,
      template: 'subscription_expired',
      recipientId: owner.userId,
      data: { vendorName: owner.companyName, renewalLink: `${appUrl}/owner/renew` },
    }).catch(() => {});
  }

  // Warn vendors expiring in 7 days
  const warningVendors = await prisma.vendor.findMany({
    where: {
      subscriptionEnd: { gte: now, lte: warningDate },
      subscriptionStatus: 'ACTIVE',
    },
    include: { user: true },
  });

  for (const vendor of warningVendors) {
    const daysLeft = Math.ceil((vendor.subscriptionEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    await sendWhatsApp({
      to: vendor.user.phone,
      template: 'subscription_expiring_soon',
      recipientId: vendor.userId,
      data: { daysLeft, renewalLink: `${appUrl}/vendor/renew` },
    }).catch(() => {});
  }

  logger.info(`Expired: ${expiredVendors.length} vendors, ${expiredOwners.length} owners. Warned: ${warningVendors.length} vendors`);
}
