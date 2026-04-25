import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getOwnerDashboard } from '../../services/owner.service';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/common/Card';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';

interface Props { navigation: any; }

export function OwnerDashboardScreen({ navigation }: Props) {
  const { user, hasFeature } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: getOwnerDashboard,
    refetchInterval: 60000,
  });

  if (isLoading) return <SafariLoader />;

  const stats = data?.stats;
  const owner = data?.owner;

  // Only show actions the admin has enabled for this owner
  const allActions = [
    { icon: '🚙', label: 'Shared Safaris',   screen: 'SharedSafaris',  color: '#DCFCE7', feature: 'SHARED_TRIPS' },
    { icon: '👑', label: 'Private Safaris',  screen: 'PrivateSafaris', color: '#FEF3C7', feature: 'PRIVATE_SAFARI' },
    { icon: '💳', label: 'Vendor Payments',  screen: 'VendorPayments', color: '#DBEAFE', feature: 'VENDOR_LISTINGS' },
    { icon: '📊', label: 'Revenue',          screen: 'Revenue',        color: '#F3E8FF', feature: 'REPORTS_ANALYTICS' },
  ];
  const quickActions = allActions.filter((a) => hasFeature(a.feature));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Safari Owner</Text>
            <Text style={styles.name}>{owner?.companyName || user?.name}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('OwnerProfile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{(owner?.companyName || user?.name || 'O')[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription warning */}
        {owner?.subscriptionStatus !== 'ACTIVE' && (
          <View style={styles.subWarning}>
            <Text style={styles.subWarningText}>
              ⚠️ Subscription {owner?.subscriptionStatus?.toLowerCase()}. Contact Super Admin to activate.
            </Text>
          </View>
        )}

        {/* No features yet */}
        {quickActions.length === 0 && (
          <View style={styles.noFeatures}>
            <Text style={styles.noFeaturesIcon}>🔒</Text>
            <Text style={styles.noFeaturesTitle}>No features enabled</Text>
            <Text style={styles.noFeaturesText}>
              The Super Admin will assign features to your account.
            </Text>
          </View>
        )}

        {/* Stats — only show relevant ones */}
        {stats && quickActions.length > 0 && (
          <View style={styles.statsGrid}>
            {hasFeature('SHARED_TRIPS') && (
              <Card style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
                <Text style={styles.statIcon}>🚙</Text>
                <Text style={styles.statValue}>{stats.upcomingShared}</Text>
                <Text style={styles.statLabel}>Upcoming Shared</Text>
              </Card>
            )}
            {hasFeature('PRIVATE_SAFARI') && (
              <Card style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.statIcon}>👑</Text>
                <Text style={styles.statValue}>{stats.upcomingPrivate}</Text>
                <Text style={styles.statLabel}>Upcoming Private</Text>
              </Card>
            )}
            {hasFeature('REPORTS_ANALYTICS') && (
              <Card style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={[styles.statValue, { fontSize: 14 }]}>
                  {formatCurrency(parseFloat(stats.monthRevenue || '0'))}
                </Text>
                <Text style={styles.statLabel}>This Month</Text>
              </Card>
            )}
            {hasFeature('VENDOR_LISTINGS') && (
              <Card style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.statIcon}>⏳</Text>
                <Text style={styles.statValue}>{stats.pendingVendorPayments}</Text>
                <Text style={styles.statLabel}>Pending Payments</Text>
              </Card>
            )}
          </View>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Manage</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.screen}
                  onPress={() => navigation.navigate(action.screen)}
                  style={[styles.actionCard, { backgroundColor: action.color }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Create Safari CTA — only if SHARED_TRIPS enabled */}
        {hasFeature('SHARED_TRIPS') && (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateSafari')}
            style={styles.createBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>+ Create New Shared Safari</Text>
          </TouchableOpacity>
        )}
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  subWarning: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 16 },
  subWarningText: { color: '#92400E', fontSize: 13 },
  noFeatures: { alignItems: 'center', paddingVertical: 40 },
  noFeaturesIcon: { fontSize: 48, marginBottom: 12 },
  noFeaturesTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray[700], marginBottom: 8 },
  noFeaturesText: { fontSize: 14, color: Colors.gray[400], textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '47%', alignItems: 'center', padding: 14, borderWidth: 0 },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.gray[900] },
  statLabel: { fontSize: 11, color: Colors.gray[500], marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  actionCard: { width: '47%', borderRadius: 16, padding: 20, alignItems: 'center' },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray[700] },
  createBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  createBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
