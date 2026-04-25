import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { sendWhatsApp } from './whatsapp.service';
import { successResponse } from '../../types';

const router = Router();
const wrap = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post(
  '/whatsapp/send',
  authenticate,
  requireRole('SUPER_ADMIN'),
  wrap(async (req: any, res: any) => {
    const { to, template, data } = req.body;
    await sendWhatsApp({ to, template, data });
    res.json(successResponse(null, 'Message sent'));
  })
);

router.post(
  '/test',
  authenticate,
  requireRole('SUPER_ADMIN'),
  wrap(async (req: any, res: any) => {
    const { phone } = req.body;
    await sendWhatsApp({
      to: phone,
      template: 'safari_confirmed',
      data: { date: new Date().toDateString(), safariType: 'Full Day', seatNumber: 1, pickupTime: '06:00 AM' },
    });
    res.json(successResponse(null, 'Test notification sent'));
  })
);

export { router as notificationsRouter };
