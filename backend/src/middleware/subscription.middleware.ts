import { Response, NextFunction } from 'express';
import { AuthRequest, errorResponse } from '../types';
import { prisma } from '../config/database';

export async function requireActiveSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json(errorResponse('Unauthorized'));
    return;
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: req.user.userId },
    select: { subscriptionStatus: true, subscriptionEnd: true },
  });

  if (!vendor) {
    next();
    return;
  }

  if (vendor.subscriptionStatus !== 'ACTIVE') {
    res.status(403).json(
      errorResponse('Subscription inactive. Please renew your subscription to access this feature.')
    );
    return;
  }

  if (vendor.subscriptionEnd && vendor.subscriptionEnd < new Date()) {
    await prisma.vendor.update({
      where: { userId: req.user.userId },
      data: { subscriptionStatus: 'EXPIRED' },
    });
    res.status(403).json(errorResponse('Subscription expired. Please renew to continue.'));
    return;
  }

  next();
}
