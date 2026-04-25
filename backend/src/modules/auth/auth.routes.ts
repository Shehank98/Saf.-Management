import { Router } from 'express';
import * as ctrl from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/register', wrap(ctrl.register));
router.post('/login', wrap(ctrl.login));
router.post('/refresh', wrap(ctrl.refresh));
router.post('/logout', wrap(ctrl.logout));
router.get('/me', authenticate, wrap(ctrl.me));

export { router as authRouter };
