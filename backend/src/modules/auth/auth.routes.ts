import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as ctrl from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { successResponse } from '../../types';

const router = Router();

const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Admin bootstrap/reset — always upserts with a fresh bcryptjs hash
router.get('/setup-admin', wrap(async (_req: any, res: any) => {
  const password = 'Admin@123';
  const hashed = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@safari.lk' },
    update: {
      password: hashed,
      role: 'SUPER_ADMIN',
      approvalStatus: 'APPROVED',
    },
    create: {
      email: 'admin@safari.lk',
      phone: '+94771000000',
      password: hashed,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      approvalStatus: 'APPROVED',
    },
  });
  res.json({ message: 'Admin ready', email: admin.email, password });
}));

// Public endpoint — registration form fetches available locations
router.get('/locations', wrap(async (_req: any, res: any) => {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true },
  });
  res.json(successResponse(locations));
}));

router.post('/register', wrap(ctrl.register));
router.post('/login',    wrap(ctrl.login));
router.post('/refresh',  wrap(ctrl.refresh));
router.post('/logout',   wrap(ctrl.logout));
router.get('/me',        authenticate, wrap(ctrl.me));

export { router as authRouter };
