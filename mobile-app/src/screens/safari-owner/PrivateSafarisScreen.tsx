import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.service';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props { navigation: any; }

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  INQUIRY:         { color: '#1D4ED8', bg: '#DBEAFE', label: 'Inquiry',        emoji: '📋' },
  DEPOSIT_PENDING: { color: '#92400E', bg: '#FEF3C7', label: 'Deposit Pending', emoji: '⏳' },
  DEPOSIT_PAID:    { color: '#166534', bg: '#DCFCE7', label: 'Deposit Paid',    emoji: '💰' },
  CONFIRMED:       { color: '#14532D', bg: '#BBF7D0', label: 'Confirmed',       emoji: '✅' },
  COMPLETED:       { color: '#374151', bg: '#F3F4F6', label: 'Completed',       emoji: '🏁' },
  CANCELLED:       { color: '#991B1B', bg: '#FEE2E2', label: 'Cancelled',       emoji: '❌' },
};

function SafariCard({ safari, onPress, delay }: { safari: any; onPress: () => void; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay, useNativeDriver: true, tension: 80, friction: 8,
    }).start();
  }, []);

  const st = STATUS_CONFIG[safari.status] || STATUS_CONFIG.INQUIRY;
  const customer = safari.booking?.customer?.user;

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
    }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardType}>{safari.safariType}</Text>
              <Text style={styles.cardDate}>{formatDate(safari.safariDate)}</Text>
              {customer && <Text style={styles.cardCustomer}>👤 {customer.name}</Text>}
            </View>
            <View style={[styles.badge, { backgroundColor: st.bg }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.emoji} {st.label}</Text>
            </View>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Guests</Text>
              <Text style={styles.metaValue}>{safari.numberOfGuests}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Total</Text>
              <Text style={[styles.metaValue, { color: Colors.primary }]}>
                {formatCurrency(parseFloat(safari.totalAmount))}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Deposit</Text>
              <Text style={[styles.metaValue, { color: safari.depositPaid ? Colors.success : Colors.warning }]}>
                {safari.depositPaid ? '✓ Paid' : '⏳ Pending'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function PrivateSafarisScreen({ navigation }: Props) {
  const headerAnim = useRef(new Animated.Value(0)).current;

  const { data: safaris = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['private-safaris'],
    queryFn: async () => {
      const res = await api.get('/private-safari/owner/list');
      return res.data.data;
    },
  });

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  if (isLoading) return <SafariLoader text="Loading safaris..." />;

  const upcoming = safaris.filter((s: any) => new Date(s.safariDate) >= new Date() && s.status !== 'COMPLETED' && s.status !== 'CANCELLED');
  const past     = safaris.filter((s: any) => new Date(s.safariDate) < new Date() || s.status === 'COMPLETED');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.secondary} />}
      >
        {/* Header */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        }]}>
          <View>
            <Text style={styles.title}>Private Safaris</Text>
            <Text style={styles.subtitle}>{upcoming.length} upcoming · {past.length} past</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreatePrivateSafari')}
            style={styles.newBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Empty state */}
        {safaris.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👑</Text>
            <Text style={styles.emptyTitle}>No Private Safaris Yet</Text>
            <Text style={styles.emptyText}>Create your first private safari booking to get started.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreatePrivateSafari')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>+ Create Safari</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <Text style={styles.section}>Upcoming</Text>
            {upcoming.map((safari: any, i: number) => (
              <SafariCard
                key={safari.id}
                safari={safari}
                delay={i * 60}
                onPress={() => navigation.navigate('PrivateSafariDetail', { safariId: safari.id })}
              />
            ))}
          </>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <Text style={[styles.section, { marginTop: 20 }]}>Past Safaris</Text>
            {past.map((safari: any, i: number) => (
              <SafariCard
                key={safari.id}
                safari={safari}
                delay={i * 40}
                onPress={() => navigation.navigate('PrivateSafariDetail', { safariId: safari.id })}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { padding: 16, paddingBottom: 40 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  title:        { fontSize: 24, fontWeight: '800', color: Colors.gray[900] },
  subtitle:     { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  newBtn:       { backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  newBtnText:   { color: Colors.white, fontWeight: '700', fontSize: 14 },
  section:      { fontSize: 15, fontWeight: '700', color: Colors.gray[700], marginBottom: 10 },
  card:         { marginBottom: 12 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardType:     { fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  cardDate:     { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  cardCustomer: { fontSize: 12, color: Colors.gray[400], marginTop: 4 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  cardMeta:     { flexDirection: 'row', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  metaItem:     { flex: 1, alignItems: 'center' },
  metaLabel:    { fontSize: 11, color: Colors.gray[400], marginBottom: 2 },
  metaValue:    { fontSize: 14, fontWeight: '700', color: Colors.gray[800] },
  emptyCard:    { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: Colors.gray[700], marginBottom: 6 },
  emptyText:    { fontSize: 14, color: Colors.gray[400], textAlign: 'center', marginBottom: 20 },
  emptyBtn:     { backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: Colors.white, fontWeight: '700' },
});
