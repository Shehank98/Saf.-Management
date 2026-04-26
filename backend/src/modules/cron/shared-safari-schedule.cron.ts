import { prisma } from '../../config/database';
import { autoScheduleJeeps } from '../shared-safaris/shared-safari.service';
import { logger } from '../../utils/logger';

export async function checkSharedSafariSchedule(): Promise<void> {
  logger.info('Running shared safari auto-schedule cron');

  const owners = await prisma.safariOwner.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      OR: [
        { priceFullDay: { not: null } },
        { priceHalfDayMorning: { not: null } },
        { priceHalfDayAfternoon: { not: null } },
      ],
    },
    select: { id: true, priceFullDay: true, priceHalfDayMorning: true, priceHalfDayAfternoon: true },
  });

  let totalCreated = 0;
  for (const owner of owners) {
    const created = await autoScheduleJeeps(
      owner.id,
      {
        priceFullDay:          owner.priceFullDay ? parseFloat(owner.priceFullDay.toString()) : null,
        priceHalfDayMorning:   owner.priceHalfDayMorning ? parseFloat(owner.priceHalfDayMorning.toString()) : null,
        priceHalfDayAfternoon: owner.priceHalfDayAfternoon ? parseFloat(owner.priceHalfDayAfternoon.toString()) : null,
      },
      30,
    );
    totalCreated += created;
  }

  logger.info(`Auto-schedule cron: created ${totalCreated} jeep slots across ${owners.length} owners`);
}
