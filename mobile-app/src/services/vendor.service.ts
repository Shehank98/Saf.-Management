import { api } from './api.service';

export async function getDashboard() {
  const res = await api.get('/vendors/dashboard');
  return res.data.data;
}

export async function getEarnings(period: 'month' | 'year' | 'all' = 'month') {
  const res = await api.get(`/vendors/earnings?period=${period}`);
  return res.data.data;
}

export async function paySubscription(months: number, paymentProof?: string) {
  const res = await api.post('/vendors/subscription/pay', { months, paymentProof });
  return res.data.data;
}

export async function updateAvailability(isAvailable: boolean, blockedDates?: string[]) {
  const res = await api.patch('/vendors/availability', { isAvailable, blockedDates });
  return res.data.data;
}

export async function getProfile() {
  const res = await api.get('/vendors/profile');
  return res.data.data;
}
