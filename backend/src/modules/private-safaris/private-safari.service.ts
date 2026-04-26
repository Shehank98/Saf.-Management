import { prisma } from '../../config/database';

export async function createInquiry(ownerId: string, data: {
  safariDate: string;
  safariType: string;
  numberOfGuests: number;
  totalAmount: number;
  depositPercentage?: number;
  locationId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  specialRequests?: string;
}) {
  const depositPct = data.depositPercentage || 30;
  const depositAmount = (data.totalAmount * depositPct) / 100;

  if (data.locationId) {
    const ownerLoc = await prisma.safariOwnerLocation.findFirst({
      where: { ownerId, locationId: data.locationId },
    });
    if (!ownerLoc) {
      throw Object.assign(new Error('You do not operate in this location'), { status: 403 });
    }
  }

  return prisma.privateSafari.create({
    data: {
      ownerId,
      safariDate: new Date(data.safariDate),
      safariType: data.safariType,
      numberOfGuests: data.numberOfGuests,
      totalAmount: data.totalAmount,
      depositAmount,
      status: 'INQUIRY',
      locationId: data.locationId || null,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      customerEmail: data.customerEmail || null,
      specialRequests: data.specialRequests || null,
    },
  });
}

export async function getPrivateSafari(id: string) {
  return prisma.privateSafari.findUnique({
    where: { id },
    include: {
      booking: { include: { customer: { include: { user: { select: { name: true, phone: true, email: true } } } } } },
      jeepAssignment: { include: { vendor: { include: { user: { select: { name: true, phone: true } } } } } },
      guideAssignment: { include: { vendor: { include: { user: { select: { name: true, phone: true } } } } } },
      mealOrders: { include: { vendor: { include: { user: { select: { name: true, phone: true } } } } } },
      location: { select: { id: true, name: true } },
    },
  });
}

export async function updateStatus(id: string, status: string) {
  return prisma.privateSafari.update({ where: { id }, data: { status: status as any } });
}

export async function assignVendors(id: string, vendors: {
  jeepVendorId?: string;
  jeepNumber?: string;
  rentalFee?: number;
  guideVendorId?: string;
  guideFee?: number;
  restaurantVendorId?: string;
  mealCost?: number;
  numberOfMeals?: number;
  accommodationVendorId?: string;
  accommodationCost?: number;
  cameraVendorId?: string;
  cameraCost?: number;
}) {
  const safari = await prisma.privateSafari.findUnique({
    where: { id },
    select: { locationId: true, totalAmount: true },
  });
  if (!safari) throw Object.assign(new Error('Safari not found'), { status: 404 });

  // Location validation for all vendor types that support it
  const vendorsToCheck = [
    { vendorId: vendors.jeepVendorId, label: 'Jeep vendor' },
    { vendorId: vendors.guideVendorId, label: 'Guide vendor' },
    { vendorId: vendors.restaurantVendorId, label: 'Restaurant vendor' },
    { vendorId: vendors.accommodationVendorId, label: 'Accommodation vendor' },
    { vendorId: vendors.cameraVendorId, label: 'Camera vendor' },
  ];

  if (safari.locationId) {
    for (const { vendorId, label } of vendorsToCheck) {
      if (vendorId) {
        const ok = await prisma.vendorLocation.findFirst({
          where: { vendorId, locationId: safari.locationId },
        });
        if (!ok) throw Object.assign(new Error(`${label} does not service this location`), { status: 400 });
      }
    }
  }

  // Jeep assignment
  if (vendors.jeepVendorId && vendors.jeepNumber && vendors.rentalFee !== undefined) {
    await prisma.jeepAssignment.upsert({
      where: { privateSafariId: id },
      update: { vendorId: vendors.jeepVendorId, jeepNumber: vendors.jeepNumber, rentalFee: vendors.rentalFee },
      create: { vendorId: vendors.jeepVendorId, privateSafariId: id, jeepNumber: vendors.jeepNumber, rentalFee: vendors.rentalFee },
    });
    await upsertVendorPayment(vendors.jeepVendorId, id, vendors.rentalFee, 'Jeep', 'JEEP');
  }

  // Guide assignment
  if (vendors.guideVendorId && vendors.guideFee !== undefined) {
    await prisma.guideAssignment.upsert({
      where: { privateSafariId: id },
      update: { vendorId: vendors.guideVendorId, guideFee: vendors.guideFee },
      create: { vendorId: vendors.guideVendorId, privateSafariId: id, guideFee: vendors.guideFee },
    });
    await upsertVendorPayment(vendors.guideVendorId, id, vendors.guideFee, 'Guide', 'GUIDE');
  }

  // Restaurant / meals
  if (vendors.restaurantVendorId && vendors.mealCost !== undefined) {
    await prisma.mealOrder.deleteMany({ where: { privateSafariId: id } });
    await prisma.mealOrder.create({
      data: {
        vendorId: vendors.restaurantVendorId,
        privateSafariId: id,
        numberOfMeals: vendors.numberOfMeals || 1,
        mealTypes: [],
        dietaryReqs: {},
        totalCost: vendors.mealCost,
      },
    });
    await upsertVendorPayment(vendors.restaurantVendorId, id, vendors.mealCost, 'Meals', 'MEAL');
  }

  // Accommodation
  if (vendors.accommodationVendorId && vendors.accommodationCost !== undefined) {
    await prisma.privateSafari.update({
      where: { id },
      data: { accommodationId: vendors.accommodationVendorId },
    });
    await upsertVendorPayment(vendors.accommodationVendorId, id, vendors.accommodationCost, 'Accommodation', 'ACCOMMODATION');
  }

  // Camera rental
  if (vendors.cameraVendorId && vendors.cameraCost !== undefined) {
    await upsertVendorPayment(vendors.cameraVendorId, id, vendors.cameraCost, 'Camera Rental', 'CAMERA');
  }

  // Recalculate vendor costs and profit
  await recalculateFinancials(id, safari.totalAmount);
}

async function upsertVendorPayment(
  vendorId: string,
  safariId: string,
  amount: number,
  description: string,
  serviceType: string,
) {
  const existing = await prisma.vendorPayment.findFirst({
    where: { vendorId, relatedSafariId: safariId, serviceType },
  });
  if (existing) {
    await prisma.vendorPayment.update({
      where: { id: existing.id },
      data: { amount, description },
    });
  } else {
    await prisma.vendorPayment.create({
      data: { vendorId, amount, description, serviceType, relatedSafariId: safariId, status: 'PENDING' },
    });
  }
}

async function recalculateFinancials(safariId: string, totalAmount: any) {
  const [jeep, guide, meals, payments] = await Promise.all([
    prisma.jeepAssignment.findUnique({ where: { privateSafariId: safariId }, select: { rentalFee: true } }),
    prisma.guideAssignment.findUnique({ where: { privateSafariId: safariId }, select: { guideFee: true } }),
    prisma.mealOrder.findMany({ where: { privateSafariId: safariId }, select: { totalCost: true } }),
    prisma.vendorPayment.findMany({
      where: { relatedSafariId: safariId, serviceType: { in: ['ACCOMMODATION', 'CAMERA'] } },
      select: { amount: true },
    }),
  ]);

  const vendorCosts =
    Number(jeep?.rentalFee || 0) +
    Number(guide?.guideFee || 0) +
    meals.reduce((s, m) => s + Number(m.totalCost), 0) +
    payments.reduce((s, p) => s + Number(p.amount), 0);

  const profit = Number(totalAmount) - vendorCosts;

  await prisma.privateSafari.update({
    where: { id: safariId },
    data: { vendorCosts, profit },
  });
}

export async function getOwnerSafaris(ownerId: string, status?: string) {
  return prisma.privateSafari.findMany({
    where: {
      ownerId,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      booking: { include: { customer: { include: { user: { select: { name: true, phone: true, email: true } } } } } },
      location: { select: { id: true, name: true } },
      jeepAssignment: {
        include: { vendor: { include: { user: { select: { name: true } } } } },
      },
      guideAssignment: {
        include: { vendor: { include: { user: { select: { name: true } } } } },
      },
      mealOrders: {
        include: { vendor: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { safariDate: 'desc' },
  });
}

export async function bookPrivateSafari(safariId: string, customerId: string, specialRequests?: string) {
  const safari = await prisma.privateSafari.findUnique({ where: { id: safariId } });
  if (!safari) throw Object.assign(new Error('Safari not found'), { status: 404 });
  if (safari.status !== 'INQUIRY' && safari.status !== 'DEPOSIT_PENDING') {
    throw Object.assign(new Error('Safari not available for booking'), { status: 400 });
  }

  return prisma.$transaction(async (tx) => {
    const booking = await tx.privateSafariBooking.create({
      data: { safariId, customerId, specialRequests },
    });
    await tx.privateSafari.update({
      where: { id: safariId },
      data: { status: 'DEPOSIT_PENDING' },
    });
    return booking;
  });
}
