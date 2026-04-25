import { api } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SAFARI_OWNER' | 'VENDOR' | 'CUSTOMER';
}

export async function loginUser(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const res = await api.post('/auth/login', { email, password });
  const { user, accessToken, refreshToken } = res.data.data;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }
  return { user, accessToken, refreshToken };
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}
