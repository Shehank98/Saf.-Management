import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { authRouter } from './modules/auth/auth.routes';
import { vendorRouter } from './modules/vendors/vendors.routes';
import { sharedSafariRouter } from './modules/shared-safaris/shared-safari.routes';
import { privateSafariRouter } from './modules/private-safaris/private-safari.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { ownerRouter } from './modules/safari-owners/owner.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();

app.set('trust proxy', 1);

// Security
app.use(helmet());
// Mobile apps don't send an Origin header, so we allow all origins.
// Restrict via ALLOWED_ORIGINS in production if needed for web-only clients.
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  credentials: true,
}));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }));
app.use('/api', rateLimit({ windowMs: 1 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

// Body parsing (must come before raw body routes)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: process.env.npm_package_version });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/vendors', vendorRouter);
app.use('/api/shared-safari', sharedSafariRouter);
app.use('/api/private-safari', privateSafariRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/notifications', notificationsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

export { app };
