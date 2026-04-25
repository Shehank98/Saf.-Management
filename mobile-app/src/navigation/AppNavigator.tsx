import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';
import { getStoredUser } from '../services/auth.service';
import { AuthNavigator } from './AuthNavigator';
import { VendorNavigator } from './VendorNavigator';
import { SafariLoader } from '../components/animations/SafariLoader';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (isLoading) return <SafariLoader />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Vendor" component={VendorNavigator} />
      )}
    </Stack.Navigator>
  );
}
