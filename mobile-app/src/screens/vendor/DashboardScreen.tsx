import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../services/vendor.service';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/common/Card';
import { SubscriptionBanner } from '../../components/vendor/SubscriptionBanner';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Colors } from '../../theme/colors';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Props {
  navigation: any;
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60000,
  });

  const vendor = data?.vendor;
  const stats = data?.stats;

  if (isLoading) return <SafariLoader />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning! 🌅</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Banner */}
        {vendor && (
          <SubscriptionBanner
            status={vendor.subscriptionStatus}
            expiryDate={vendor.subscriptionEnd}
            onRenewPress={() => navigation.navigate('Subscription')}
          />
        )}

        {/* Stats Row */}
        {stats && (
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.monthlyEarnings)}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statIcon}>⏳</Text>
              <Text style={[styles.statValue, { color: Colors.warning }]}>{formatCurrency(stats.pendingPayments)}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{vendor?.averageRating ? vendor.averageRating.toFixed(1) : 'N/A'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Card>
          </View>
        )}

        {/* Vendor Type Badge */}
        {vendor && (
          <Card style={styles.vendorCard}>
            <View style={styles.vendorRow}>
              <View style={styles.vendorInfo}>
                <Text style={styles.businessName}>{vendor.businessName}</Text>
                <Text style={styles.vendorType}>{vendor.vendorType.replace('_', ' ')}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: vendor.subscriptionStatus === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: vendor.subscriptionStatus === 'ACTIVE' ? Colors.success : Colors.error }
                ]}>
                  {vendor.subscriptionStatus}
                </Text>
              </View>
            </View>

            <View style={styles.availabilityRow}>
              <Text style={styles.availabilityLabel}>Availability</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={[styles.availabilityToggle, { backgroundColor: vendor.isAvailable ? Colors.success : Colors.gray[300] }]}
              >
                <View style={[styles.toggleDot, { transform: [{ translateX: vendor.isAvailable ? 16 : 0 }] }]} />
              </TouchableOpacity>
              <Text style={[styles.availabilityValue, { color: vendor.isAvailable ? Colors.success : Colors.gray[500] }]}>
                {vendor.isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: '📋', label: 'Bookings', screen: 'Bookings' },
            { icon: '💳', label: 'Earnings', screen: 'Earnings' },
            { icon: '🔔', label: 'Subscription', screen: 'Subscription' },
            { icon: '👤', label: 'Profile', screen: 'Profile' },
          ].map((action) => (
            <TouchableOpacity
              key={action.screen}
              onPress={() => navigation.navigate(action.screen)}
              style={styles.actionCard}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 13, color: Colors.gray[500] },
  name: { fontSize: 22, fontWeight: '800', color: Colors.gray[900] },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', padding: 14 },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '800', color: Colors.gray[900] },
  statLabel: { fontSize: 11, color: Colors.gray[400], marginTop: 2 },
  vendorCard: { marginBottom: 20 },
  vendorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  vendorInfo: {},
  businessName: { fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  vendorType: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  availabilityLabel: { fontSize: 14, color: Colors.gray[600] },
  availabilityToggle: { width: 44, height: 26, borderRadius: 13, padding: 2 },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.white, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  availabilityValue: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', backgroundColor: Colors.white, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray[700] },
});
