import { Router } from 'express';
import * as ctrl from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { successResponse } from '../../types';

const router = Router();

const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

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
