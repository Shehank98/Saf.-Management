import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';
import { getStoredUser } from '../services/auth.service';
import { AuthNavigator } from './AuthNavigator';
import { VendorNavigator } from './VendorNavigator';
import { OwnerNavigator } from './OwnerNavigator';
import { SafariLoader } from '../components/animations/SafariLoader';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user } = useAuthStore();

  if (!user) return <AuthNavigator />;

  // Route to the correct experience based on role
  switch (user.role) {
    case 'SAFARI_OWNER':
      return <OwnerNavigator />;
    case 'VENDOR':
      return <VendorNavigator />;
    default:
      // SUPER_ADMIN and CUSTOMER — use web app
      return <AuthNavigator />;
  }
}

export function AppNavigator() {
  const { isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (isLoading) return <SafariLoader />;

  return <AppContent />;
}
