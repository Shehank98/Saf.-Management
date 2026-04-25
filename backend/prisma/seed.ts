import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@safari.lk' },
    update: {},
    create: {
      email: 'admin@safari.lk',
      phone: '+94771000000',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      name: 'Super Admin',
    },
  });

  await prisma.systemSettings.createMany({
    skipDuplicates: true,
    data: [
      { key: 'shared_safari_commission_rate', value: 15.0, description: 'Percentage commission on shared safaris' },
      { key: 'vendor_monthly_fee', value: 1000.0, description: 'Monthly subscription fee for vendors (LKR)' },
      { key: 'owner_monthly_fee', value: 2500.0, description: 'Monthly subscription fee for safari owners (LKR)' },
      { key: 'deposit_percentage', value: 30.0, description: 'Deposit percentage for private safaris' },
      { key: 'payment_deadline_hours', value: 24, description: 'Hours to complete payment after reservation' },
      { key: 'safari_cancellation_hours', value: 24, description: 'Hours before safari to auto-cancel if min not met' },
      { key: 'pickup_radius_km', value: 7, description: 'Maximum pickup radius in kilometers' },
      { key: 'min_seats_for_confirmation', value: 4, description: 'Minimum paid seats to confirm shared safari' },
    ],
  });

  console.log('Seeded admin:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
