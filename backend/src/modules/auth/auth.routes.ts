import { Router } from 'express';
import * as ctrl from './auth.controller';

const router = Router();

const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/register', wrap(ctrl.register));
router.post('/login', wrap(ctrl.login));
router.post('/refresh', wrap(ctrl.refresh));
router.post('/logout', wrap(ctrl.logout));

export { router as authRouter };
