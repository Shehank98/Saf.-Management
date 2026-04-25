import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api.service';

export interface UserFeature {
  feature: string;
  enabled: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SAFARI_OWNER' | 'VENDOR' | 'CUSTOMER';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  features: UserFeature[];
}

export async function login(email: string, password: string): Promise<User> {
  const res = await api.post('/auth/login', { email, password });
  const { user, accessToken, refreshToken } = res.data.data;

  // Fetch full user profile including features
  await AsyncStorage.multiSet([
    ['accessToken', accessToken],
    ['refreshToken', refreshToken],
    ['user', JSON.stringify(user)],
  ]);

  // Fetch features after login
  try {
    const meRes = await api.get('/auth/me');
    const fullUser: User = { ...user, features: meRes.data.data.features || [] };
    await AsyncStorage.setItem('user', JSON.stringify(fullUser));
    return fullUser;
  } catch {
    return { ...user, features: [] };
  }
}

export async function register(data: {
  email: string;
  phone: string;
  password: string;
  name: string;
  role: string;
  vendorType?: string;
  businessName?: string;
  companyName?: string;
  companyAddress?: string;
}): Promise<User> {
  const res = await api.post('/auth/register', data);
  const { user } = res.data.data;
  // Don't store tokens on register — user must wait for approval then log in
  return { ...user, features: [] };
}

export async function logout(): Promise<void> {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (refreshToken) {
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
  }
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
}

export async function getStoredUser(): Promise<User | null> {
  const stored = await AsyncStorage.getItem('user');
  if (!stored) return null;
  const user = JSON.parse(stored) as User;
  if (!user.features) user.features = [];
  return user;
}

export function hasFeature(user: User | null, feature: string): boolean {
  if (!user) return false;
  return user.features?.some((f) => f.feature === feature && f.enabled) || false;
}
