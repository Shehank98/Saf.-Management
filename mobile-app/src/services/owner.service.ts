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

export async function getPrivateSafaris(status?: string) {
  const url = status ? `/private-safari/owner/list?status=${status}` : '/private-safari/owner/list';
  const res = await api.get(url);
  return res.data.data;
}

export async function createPrivateSafari(data: {
  safariDate: string;
  safariType: string;
  numberOfGuests: number;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  specialRequests?: string;
}) {
  const res = await api.post('/private-safari/inquiry', data);
  return res.data.data;
}

export async function updatePrivateSafariStatus(safariId: string, status: string) {
  const res = await api.patch(`/private-safari/${safariId}/status`, { status });
  return res.data.data;
}

export async function getOwnerRevenue() {
  const res = await api.get('/owner/revenue');
  return res.data.data;
}

export async function getPaymentTracking(jeepId: string) {
  const res = await api.get(`/shared-safari/jeeps/${jeepId}/payment-tracking`);
  return res.data.data;
}

export async function generateBookingLink(jeepId: string) {
  const res = await api.post(`/shared-safari/jeeps/${jeepId}/booking-link`);
  return res.data.data;
}
