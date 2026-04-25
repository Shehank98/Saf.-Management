import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { OwnerDashboardScreen } from '../screens/safari-owner/OwnerDashboardScreen';
import { SharedSafarisScreen } from '../screens/safari-owner/SharedSafarisScreen';
import { SafariDetailScreen } from '../screens/safari-owner/SafariDetailScreen';
import { CreateSafariScreen } from '../screens/safari-owner/CreateSafariScreen';
import { VendorPaymentsScreen } from '../screens/safari-owner/VendorPaymentsScreen';
import { RevenueScreen } from '../screens/safari-owner/RevenueScreen';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: Colors.secondary },
  headerTintColor: Colors.white,
  headerTitleStyle: { fontWeight: '700' as const },
};

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="OwnerHome" component={OwnerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="CreateSafari" component={CreateSafariScreen} options={{ title: 'New Safari' }} />
      <Stack.Screen name="OwnerProfile" component={OwnerDashboardScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

function SafarisStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="SafarisList" component={SharedSafarisScreen} options={{ title: 'Shared Safaris' }} />
      <Stack.Screen name="SafariDetail" component={SafariDetailScreen} options={{ title: 'Safari Details' }} />
      <Stack.Screen name="CreateSafari" component={CreateSafariScreen} options={{ title: 'New Safari' }} />
    </Stack.Navigator>
  );
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.55 }}>{icon}</Text>;
}

export function OwnerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: 4,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="OwnerDashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SharedSafaris"
        component={SafarisStack}
        options={{
          tabBarLabel: 'Safaris',
          tabBarIcon: ({ focused }) => <TabIcon icon="🚙" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="VendorPayments"
        component={VendorPaymentsScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} />,
          headerShown: true,
          headerTitle: 'Vendor Payments',
          ...headerStyle,
        }}
      />
      <Tab.Screen
        name="Revenue"
        component={RevenueScreen}
        options={{
          tabBarLabel: 'Revenue',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
          headerShown: true,
          headerTitle: 'Revenue',
          ...headerStyle,
        }}
      />
    </Tab.Navigator>
  );
}
