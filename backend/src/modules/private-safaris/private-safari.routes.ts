import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { successResponse, errorResponse, AuthRequest } from '../../types';
import * as service from './private-safari.service';
import { prisma } from '../../config/database';
import { sendWhatsApp } from '../notifications/whatsapp.service';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// List owner's private safaris
router.get('/owner/list', authenticate, requireRole('SAFARI_OWNER'), wrap(async (req: AuthRequest, res: any) => {
  const owner = await prisma.safariOwner.findUnique({ where: { userId: req.user!.userId } });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }
  const safaris = await service.getOwnerSafaris(owner.id, req.query.status as string | undefined);
  res.json(successResponse(safaris));
}));

router.post('/inquiry', authenticate, requireRole('SAFARI_OWNER'), wrap(async (req: AuthRequest, res: any) => {
  const owner = await prisma.safariOwner.findUnique({ where: { userId: req.user!.userId } });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }
  const safari = await service.createInquiry(owner.id, req.body);
  res.status(201).json(successResponse(safari));
}));

router.get('/:id', authenticate, wrap(async (req: any, res: any) => {
  const safari = await service.getPrivateSafari(req.params.id);
  if (!safari) { res.status(404).json(errorResponse('Safari not found')); return; }
  res.json(successResponse(safari));
}));

router.patch('/:id/status', authenticate, requireRole('SAFARI_OWNER', 'SUPER_ADMIN'), wrap(async (req: any, res: any) => {
  const safari = await service.updateStatus(req.params.id, req.body.status);

  if (req.body.status === 'COMPLETED') {
    const full = await prisma.privateSafari.findUnique({
      where: { id: req.params.id },
      select: {
        customerPhone: true,
        customerName: true,
        safariDate: true,
        booking: { include: { customer: { include: { user: { select: { name: true, phone: true } } } } } },
      },
    });
    const phone = full?.customerPhone || full?.booking?.customer?.user?.phone;
    const name  = full?.customerName  || full?.booking?.customer?.user?.name || 'Valued Customer';
    if (phone) {
      sendWhatsApp({
        to: phone,
        template: 'review_request',
        data: {
          customerName: name,
          date: full?.safariDate ? new Date(full.safariDate).toLocaleDateString('en-GB') : '',
          reviewLink: '',
        },
      }).catch(() => {});
    }
  }

  res.json(successResponse(safari));
}));

router.patch('/:id/assign-vendors', authenticate, requireRole('SAFARI_OWNER'), wrap(async (req: any, res: any) => {
  await service.assignVendors(req.params.id, req.body);
  res.json(successResponse(null, 'Vendors assigned'));
}));

router.post('/:id/book', authenticate, requireRole('CUSTOMER'), wrap(async (req: AuthRequest, res: any) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } });
  if (!customer) { res.status(404).json(errorResponse('Customer not found')); return; }
  const booking = await service.bookPrivateSafari(req.params.id, customer.id, req.body.specialRequests);
  res.status(201).json(successResponse(booking));
}));

export { router as privateSafariRouter };
