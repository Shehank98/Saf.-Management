import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { VendorTypeSelectionScreen } from '../screens/auth/VendorTypeSelectionScreen';
import { Colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Login"    component={LoginScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VendorTypeSelection" component={VendorTypeSelectionScreen} options={{ title: 'Vendor Type' }} />
    </Stack.Navigator>
  );
}
