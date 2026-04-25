import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { successResponse, errorResponse, AuthRequest } from '../../types';
import * as service from './private-safari.service';
import { prisma } from '../../config/database';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

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
