import { Response } from 'express';
import { AuthRequest, successResponse, errorResponse } from '../../types';
import * as vendorsService from './vendors.service';

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const vendor = await vendorsService.getVendorProfile(req.user!.userId);
  if (!vendor) { res.status(404).json(errorResponse('Vendor not found')); return; }
  res.json(successResponse(vendor));
}

export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  const data = await vendorsService.getVendorDashboard(req.user!.userId);
  res.json(successResponse(data));
}

export async function getEarnings(req: AuthRequest, res: Response): Promise<void> {
  const period = (req.query.period as 'month' | 'year' | 'all') || 'month';
  const data = await vendorsService.getEarnings(req.user!.userId, period);
  res.json(successResponse(data));
}

export async function updateAvailability(req: AuthRequest, res: Response): Promise<void> {
  const { isAvailable, blockedDates } = req.body;
  const vendor = await vendorsService.updateAvailability(
    req.user!.userId,
    isAvailable,
    blockedDates?.map((d: string) => new Date(d))
  );
  res.json(successResponse(vendor, 'Availability updated'));
}

export async function paySubscription(req: AuthRequest, res: Response): Promise<void> {
  const { months = 1, paymentProof } = req.body;
  const vendor = await vendorsService.getVendorProfile(req.user!.userId);
  if (!vendor) { res.status(404).json(errorResponse('Vendor not found')); return; }
  const updated = await vendorsService.activateSubscription(vendor.id, months, paymentProof);
  res.json(successResponse(updated, 'Subscription payment recorded'));
}

export async function getJobs(req: AuthRequest, res: Response): Promise<void> {
  const data = await vendorsService.getVendorJobs(req.user!.userId);
  res.json(successResponse(data));
}

export async function listAvailable(req: AuthRequest, res: Response): Promise<void> {
  const { vendorType, date } = req.query;
  const vendors = await vendorsService.listAvailableVendors(
    vendorType as string | undefined,
    date ? new Date(date as string) : undefined
  );
  res.json(successResponse(vendors));
}
