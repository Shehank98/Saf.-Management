import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, successResponse, errorResponse } from '../../types';
import * as service from './shared-safari.service';
import { isWithinRadius } from '../../utils/geofencing';
import { prisma } from '../../config/database';

const BASE_LOCATION = {
  lat: parseFloat(process.env.BASE_LAT || '6.9271'),
  lng: parseFloat(process.env.BASE_LNG || '79.8612'),
};
const MAX_RADIUS_KM = parseFloat(process.env.PICKUP_RADIUS_KM || '7');

export async function getAvailableDates(req: Request, res: Response): Promise<void> {
  const { ownerId, owner: ownerUserId } = req.query;

  let resolvedOwnerId = ownerId as string | undefined;
  if (ownerUserId && !resolvedOwnerId) {
    const found = await prisma.safariOwner.findUnique({
      where: { userId: ownerUserId as string },
      select: { id: true },
    });
    resolvedOwnerId = found?.id;
  }

  const dates = await service.getAvailableDates(resolvedOwnerId);
  res.json(successResponse(dates));
}

export async function getJeepsByDate(req: Request, res: Response): Promise<void> {
  const { date, type } = req.params;
  const jeeps = await service.getJeepsByDateAndType(date, type);
  res.json(successResponse(jeeps));
}

export async function validateLocation(req: Request, res: Response): Promise<void> {
  const { lat, lng } = req.body;
  const valid = isWithinRadius({ lat, lng }, BASE_LOCATION, MAX_RADIUS_KM);
  const distance = require('../../utils/geofencing').calculateDistance({ lat, lng }, BASE_LOCATION);
  res.json(successResponse({ valid, distance: parseFloat(distance.toFixed(2)), maxRadius: MAX_RADIUS_KM }));
}

export async function reserveSeat(req: AuthRequest, res: Response): Promise<void> {
  const { jeepId, seatNumber, ...pickupData } = req.body;

  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } });
  if (!customer) { res.status(404).json(errorResponse('Customer profile not found')); return; }

  if (pickupData.pickupLat != null && pickupData.pickupLng != null) {
    const valid = isWithinRadius(
      { lat: pickupData.pickupLat, lng: pickupData.pickupLng },
      BASE_LOCATION,
      MAX_RADIUS_KM
    );
    if (!valid) {
      res.status(400).json(errorResponse(`Pickup location is outside the ${MAX_RADIUS_KM}km service radius`));
      return;
    }
  }

  const booking = await service.reserveSeat(jeepId, customer.id, seatNumber, pickupData);
  res.status(201).json(successResponse(booking, 'Seat reserved. Payment link will be sent when 4 seats are reserved.'));
}

export async function getBooking(req: Request, res: Response): Promise<void> {
  const booking = await service.getBookingById(req.params.bookingId);
  if (!booking) { res.status(404).json(errorResponse('Booking not found')); return; }
  res.json(successResponse(booking));
}

export async function confirmPayment(req: Request, res: Response): Promise<void> {
  const result = await service.confirmPayment(req.params.bookingId, req.body.paymentId);
  res.json(successResponse(result, 'Payment confirmed'));
}

export async function createJeep(req: AuthRequest, res: Response): Promise<void> {
  const owner = await prisma.safariOwner.findUnique({ where: { userId: req.user!.userId } });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }
  const jeep = await service.createSharedJeep(owner.id, req.body);
  res.status(201).json(successResponse(jeep, 'Safari created'));
}

export async function getOwnerJeeps(req: AuthRequest, res: Response): Promise<void> {
  const owner = await prisma.safariOwner.findUnique({ where: { userId: req.user!.userId } });
  if (!owner) { res.status(404).json(errorResponse('Owner not found')); return; }
  const jeeps = await service.getOwnerSharedJeeps(owner.id);
  res.json(successResponse(jeeps));
}

export async function assignVendors(req: AuthRequest, res: Response): Promise<void> {
  await service.assignVendors(req.params.jeepId, req.body);
  res.json(successResponse(null, 'Vendors assigned'));
}

export async function checkConflicts(req: AuthRequest, res: Response): Promise<void> {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } });
  if (!customer) { res.status(404).json(errorResponse('Customer profile not found')); return; }

  const { jeepId } = req.query;
  const conflicts = await service.checkCustomerConflicts(customer.id, jeepId as string || '');
  res.json(successResponse({ hasConflicts: conflicts.length > 0, conflicts }));
}

export async function getJeepByToken(req: Request, res: Response): Promise<void> {
  const jeep = await service.getJeepByBookingToken(req.params.token);
  if (!jeep) { res.status(404).json(errorResponse('Booking link not found or expired')); return; }
  res.json(successResponse(jeep));
}

export async function getPaymentTracking(req: AuthRequest, res: Response): Promise<void> {
  const result = await service.getPaymentTracking(req.params.jeepId);
  if (!result) { res.status(404).json(errorResponse('Safari not found')); return; }
  res.json(successResponse(result));
}

export async function generateBookingLink(req: AuthRequest, res: Response): Promise<void> {
  const result = await service.generateBookingLink(req.params.jeepId);
  res.json(successResponse(result, 'Booking link generated'));
}

export async function reserveGuestSeat(req: Request, res: Response): Promise<void> {
  const {
    jeepId,
    seatNumbers,
    customerName,
    customerPhone,
    customerEmail,
    ...pickupData
  } = req.body;

  if (!jeepId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    res.status(400).json(errorResponse('jeepId and seatNumbers[] are required'));
    return;
  }
  if (!customerName || !customerPhone) {
    res.status(400).json(errorResponse('customerName and customerPhone are required'));
    return;
  }

  if (pickupData.pickupLat != null && pickupData.pickupLng != null) {
    const valid = isWithinRadius(
      { lat: pickupData.pickupLat, lng: pickupData.pickupLng },
      BASE_LOCATION,
      MAX_RADIUS_KM,
    );
    if (!valid) {
      res.status(400).json(errorResponse(`Pickup location is outside the ${MAX_RADIUS_KM}km service radius`));
      return;
    }
  }

  // Find or create guest user+customer by phone
  let user = await prisma.user.findUnique({ where: { phone: customerPhone } });
  if (!user) {
    const randomPass = await bcrypt.hash(Math.random().toString(36), 10);
    const email = customerEmail || `guest_${customerPhone.replace(/\D/g, '')}@safari.guest`;
    user = await prisma.user.create({
      data: {
        name: customerName,
        phone: customerPhone,
        email,
        password: randomPass,
        role: 'CUSTOMER',
        approvalStatus: 'APPROVED',
      },
    });
    await prisma.customer.create({ data: { userId: user.id } });
  }

  const customer = await prisma.customer.findUnique({ where: { userId: user.id } });
  if (!customer) {
    res.status(500).json(errorResponse('Failed to resolve customer profile'));
    return;
  }

  const bookings = [];
  for (const seatNumber of seatNumbers) {
    const booking = await service.reserveSeat(jeepId, customer.id, seatNumber, pickupData);
    bookings.push(booking);
  }

  res.status(201).json(successResponse(bookings, 'Seat(s) reserved. Payment link will be sent when 4 seats are reserved.'));
}
