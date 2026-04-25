import { create } from 'zustand';
import type { User } from '../services/auth.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  hasFeature: (feature: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  hasFeature: (feature: string) => {
    const { user } = get();
    if (!user) return false;
    return user.features?.some((f) => f.feature === feature && f.enabled) || false;
  },
}));
