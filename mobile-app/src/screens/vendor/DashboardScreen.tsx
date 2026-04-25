import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../services/vendor.service';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/common/Card';
import { SubscriptionBanner } from '../../components/vendor/SubscriptionBanner';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';

interface Props { navigation: any; }

function StatCard({ icon, label, value, bg, delay }: { icon: string; label: string; value: string; bg: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);
  return (
    <Animated.View style={[styles.statWrap, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }]}>
      <Card style={[styles.statCard, { backgroundColor: bg }]}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card>
    </Animated.View>
  );
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const headerAnim = useRef(new Animated.Value(0)).current;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60000,
  });

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const vendor = data?.vendor;
  const stats  = data?.stats;

  if (isLoading) return <SafariLoader />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetIcon = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  const quickActions = [
    { icon: '📋', label: 'My Jobs',      screen: 'Jobs',            color: '#DCFCE7' },
    { icon: '💰', label: 'Earnings',     screen: 'Earnings',        color: '#FEF3C7' },
    { icon: '💳', label: 'Subscription', screen: 'SubscriptionTab', color: '#DBEAFE' },
    { icon: '👤', label: 'Profile',      screen: 'Profile',         color: '#F3E8FF' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }]}>
          <View>
            <Text style={styles.greeting}>{greetIcon} {greeting}!</Text>
            <Text style={styles.name}>{user?.name}</Text>
            {vendor && <Text style={styles.subLabel}>{vendor.vendorType.replace('_', ' ')}</Text>}
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Subscription Banner */}
        {vendor && (
          <SubscriptionBanner
            status={vendor.subscriptionStatus}
            expiryDate={vendor.subscriptionEnd}
            onRenewPress={() => navigation.navigate('SubscriptionTab')}
          />
        )}

        {/* Stats */}
        {stats && (
          <View style={styles.statsGrid}>
            <StatCard icon="💰" label="This Month"    value={formatCurrency(stats.monthlyEarnings)} bg="#DCFCE7" delay={100} />
            <StatCard icon="⏳" label="Pending"       value={formatCurrency(stats.pendingPayments)} bg="#FEF3C7" delay={160} />
            <StatCard icon="⭐" label="Rating"        value={vendor?.averageRating ? vendor.averageRating.toFixed(1) : '—'} bg="#FEE2E2" delay={220} />
            <StatCard icon="✅" label="Status"        value={vendor?.isAvailable ? 'Available' : 'Busy'} bg={vendor?.isAvailable ? '#DCFCE7' : '#F3F4F6'} delay={280} />
          </View>
        )}

        {/* Business card */}
        {vendor && (
          <Animated.View style={{
            opacity: headerAnim,
            transform: [{ scale: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
          }}>
            <Card style={styles.vendorCard}>
              <View style={styles.vendorRow}>
                <View>
                  <Text style={styles.businessName}>{vendor.businessName}</Text>
                  <Text style={styles.vendorType}>{vendor.vendorType.replace('_', ' ')}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Jobs')}
                  style={[styles.statusBadge, { backgroundColor: vendor.subscriptionStatus === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2' }]}
                >
                  <Text style={[styles.statusText, { color: vendor.subscriptionStatus === 'ACTIVE' ? Colors.success : Colors.error }]}>
                    {vendor.subscriptionStatus}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Jobs')}
                style={styles.viewJobsBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.viewJobsText}>📋 View My Upcoming Jobs →</Text>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => {
            const anim = useRef(new Animated.Value(0)).current;
            useEffect(() => {
              Animated.spring(anim, { toValue: 1, delay: 350 + i * 60, useNativeDriver: true, tension: 80, friction: 8 }).start();
            }, []);
            return (
              <Animated.View key={action.screen} style={[styles.actionWrap, {
                opacity: anim,
                transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              }]}>
                <TouchableOpacity
                  onPress={() => navigation.navigate(action.screen)}
                  style={[styles.actionCard, { backgroundColor: action.color }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { padding: 16, paddingBottom: 32 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting:     { fontSize: 13, color: Colors.gray[500] },
  name:         { fontSize: 22, fontWeight: '800', color: Colors.gray[900] },
  subLabel:     { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: Colors.white, fontSize: 18, fontWeight: '700' },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statWrap:     { width: '47%' },
  statCard:     { alignItems: 'center', padding: 14, borderWidth: 0 },
  statIcon:     { fontSize: 24, marginBottom: 4 },
  statValue:    { fontSize: 15, fontWeight: '800', color: Colors.gray[900] },
  statLabel:    { fontSize: 11, color: Colors.gray[400], marginTop: 2 },
  vendorCard:   { marginBottom: 20 },
  vendorRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  businessName: { fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  vendorType:   { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 12, fontWeight: '700' },
  viewJobsBtn:  { backgroundColor: Colors.gray[50], borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  viewJobsText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 12 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionWrap:   { width: '47%' },
  actionCard:   { borderRadius: 16, padding: 20, alignItems: 'center' },
  actionIcon:   { fontSize: 32, marginBottom: 8 },
  actionLabel:  { fontSize: 14, fontWeight: '600', color: Colors.gray[700] },
});
