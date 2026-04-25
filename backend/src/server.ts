import 'dotenv/config';
import cron from 'node-cron';
import { app } from './app';
import { prisma } from './config/database';
import { disconnectRedis } from './config/redis';
import { logger } from './utils/logger';
import { checkPaymentDeadlines } from './modules/cron/payment-deadline.cron';
import { checkSafariCancellations } from './modules/cron/safari-cancellation.cron';
import { checkSubscriptionExpiry } from './modules/cron/subscription-expiry.cron';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function bootstrap() {
  // Verify DB connection
  await prisma.$connect();
  logger.info('Database connected');

  // Schedule cron jobs
  cron.schedule('*/5 * * * *', () => {
    checkPaymentDeadlines().catch((err) => logger.error('Payment deadline cron failed:', err));
  });

  cron.schedule('0 * * * *', () => {
    checkSafariCancellations().catch((err) => logger.error('Safari cancellation cron failed:', err));
  });

  cron.schedule('0 0 * * *', () => {
    checkSubscriptionExpiry().catch((err) => logger.error('Subscription expiry cron failed:', err));
  });

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  async function shutdown() {
    logger.info('Shutting down...');
    server.close(async () => {
      await prisma.$disconnect();
      await disconnectRedis();
      process.exit(0);
    });
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
