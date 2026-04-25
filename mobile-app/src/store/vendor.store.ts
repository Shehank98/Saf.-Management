import { create } from 'zustand';

interface VendorDashboard {
  stats: {
    monthlyEarnings: number;
    pendingPayments: number;
  };
  vendor: {
    id: string;
    businessName: string;
    vendorType: string;
    subscriptionStatus: string;
    subscriptionEnd: string | null;
    isAvailable: boolean;
    averageRating: number | null;
  } | null;
}

interface VendorState {
  dashboard: VendorDashboard | null;
  setDashboard: (data: VendorDashboard) => void;
}

export const useVendorStore = create<VendorState>((set) => ({
  dashboard: null,
  setDashboard: (dashboard) => set({ dashboard }),
}));
