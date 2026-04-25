import { api } from './api.service';

export async function getOwnerDashboard() {
  const res = await api.get('/owner/dashboard');
  return res.data.data;
}

export async function getSharedJeeps() {
  const res = await api.get('/shared-safari/owner/jeeps');
  return res.data.data;
}

export async function createSharedJeep(data: {
  safariDate: string;
  safariType: string;
  pricePerSeat: number;
}) {
  const res = await api.post('/shared-safari/jeeps', data);
  return res.data.data;
}

export async function assignVendors(
  jeepId: string,
  vendors: {
    guideVendorId?: string;
    jeepVendorId?: string;
    guideFee?: number;
    jeepRentalFee?: number;
    jeepNumber?: string;
  }
) {
  const res = await api.patch(`/shared-safari/jeeps/${jeepId}/assign-vendors`, vendors);
  return res.data.data;
}

export async function getVendorPayments() {
  const res = await api.get('/owner/vendor-payments');
  return res.data.data;
}

export async function markVendorPaid(paymentId: string) {
  const res = await api.post(`/owner/vendor-payments/${paymentId}/mark-paid`);
  return res.data.data;
}

export async function getAvailableVendors(vendorType: string) {
  const res = await api.get(`/vendors/available?vendorType=${vendorType}`);
  return res.data.data;
}

export async function getOwnerRevenue() {
  const res = await api.get('/owner/revenue');
  return res.data.data;
}
