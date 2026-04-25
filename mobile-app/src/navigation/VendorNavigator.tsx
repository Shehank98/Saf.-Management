import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { DashboardScreen }   from '../screens/vendor/DashboardScreen';
import { EarningsScreen }    from '../screens/vendor/EarningsScreen';
import { SubscriptionScreen } from '../screens/vendor/SubscriptionScreen';
import { JobsScreen }        from '../screens/vendor/JobsScreen';
import { JobDetailScreen }   from '../screens/vendor/JobDetailScreen';
import { Colors } from '../theme/colors';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.white,
  headerTitleStyle: { fontWeight: '700' as const },
};

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen}    options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Subscription"  component={SubscriptionScreen} options={{ title: 'Subscription' }} />
    </Stack.Navigator>
  );
}

function JobsStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="JobsList"  component={JobsScreen}      options={{ title: 'My Jobs' }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen}  options={{ title: 'Job Details' }} />
    </Stack.Navigator>
  );
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>{icon}</Text>;
}

export function VendorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: { borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: 4, height: 60 },
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard"    component={DashboardStack}    options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Jobs"         component={JobsStack}         options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />, tabBarLabel: 'Jobs' }} />
      <Tab.Screen name="Earnings"     component={EarningsScreen}    options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💰" focused={focused} />, tabBarLabel: 'Earnings',    headerShown: true, headerTitle: 'Earnings',     ...headerOpts }} />
      <Tab.Screen name="SubscriptionTab" component={SubscriptionScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} />, tabBarLabel: 'Subscribe', headerShown: true, headerTitle: 'Subscription', ...headerOpts }} />
    </Tab.Navigator>
  );
}
