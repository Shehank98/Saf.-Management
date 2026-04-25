import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SAFARI_OWNER' | 'VENDOR' | 'CUSTOMER';
}

export async function login(email: string, password: string): Promise<User> {
  const res = await api.post('/auth/login', { email, password });
  const { user, accessToken, refreshToken } = res.data.data;
  await AsyncStorage.multiSet([
    ['accessToken', accessToken],
    ['refreshToken', refreshToken],
    ['user', JSON.stringify(user)],
  ]);
  return user;
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
  const { user, accessToken, refreshToken } = res.data.data;
  await AsyncStorage.multiSet([
    ['accessToken', accessToken],
    ['refreshToken', refreshToken],
    ['user', JSON.stringify(user)],
  ]);
  return user;
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
  return stored ? JSON.parse(stored) : null;
}
