import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getSharedJeeps } from '../../services/owner.service';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props {
  navigation: any;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  OPEN:            { color: '#1D4ED8', bg: '#DBEAFE', label: 'Open' },
  PENDING_PAYMENT: { color: '#92400E', bg: '#FEF3C7', label: 'Pending Payment' },
  CONFIRMED:       { color: '#166534', bg: '#DCFCE7', label: 'Confirmed ✓' },
  FULLY_BOOKED:    { color: '#6B21A8', bg: '#F3E8FF', label: 'Fully Booked' },
  CANCELLED:       { color: '#991B1B', bg: '#FEE2E2', label: 'Cancelled' },
  COMPLETED:       { color: '#374151', bg: '#F3F4F6', label: 'Completed' },
};

export function SharedSafarisScreen({ navigation }: Props) {
  const { data: jeeps = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['owner-jeeps'],
    queryFn: getSharedJeeps,
  });

  if (isLoading) return <SafariLoader text="Loading safaris..." />;

  const upcoming = jeeps.filter((j: any) => new Date(j.safariDate) >= new Date());
  const past = jeeps.filter((j: any) => new Date(j.safariDate) < new Date());

  const renderJeep = (jeep: any) => {
    const status = STATUS_CONFIG[jeep.status] || STATUS_CONFIG.OPEN;
    const paidCount = jeep.bookings?.filter((b: any) => b.status === 'PAID' || b.status === 'CONFIRMED').length || 0;
    const reservedCount = jeep.bookings?.length || 0;

    return (
      <TouchableOpacity
        key={jeep.id}
        onPress={() => navigation.navigate('SafariDetail', { jeep })}
        activeOpacity={0.8}
      >
        <Card style={styles.jeepCard}>
          {/* Top row */}
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <Text style={styles.safariType}>{jeep.safariType}</Text>
              <Text style={styles.safariDate}>{formatDate(jeep.safariDate)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {/* Seat progress bar */}
          <View style={styles.seatSection}>
            <View style={styles.seatRow}>
              {Array.from({ length: 6 }, (_, i) => {
                const booking = jeep.bookings?.find((b: any) => b.seatNumber === i + 1);
                let seatColor = Colors.gray[200];
                if (booking?.status === 'PAID' || booking?.status === 'CONFIRMED') seatColor = Colors.success;
                else if (booking?.status === 'RESERVED' || booking?.status === 'PAYMENT_PENDING') seatColor = Colors.warning;
                return (
                  <View key={i} style={[styles.seatDot, { backgroundColor: seatColor }]}>
                    <Text style={styles.seatNum}>{i + 1}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.seatInfo}>
              {paidCount} paid · {reservedCount - paidCount} reserved · {6 - reservedCount} available
            </Text>
          </View>

          {/* Bottom row */}
          <View style={styles.cardFooter}>
            <Text style={styles.priceText}>{formatCurrency(parseFloat(jeep.pricePerSeat))}/seat</Text>
            <Text style={styles.totalText}>
              Total: {formatCurrency(parseFloat(jeep.pricePerSeat) * paidCount)}
            </Text>
            <Text style={styles.detailArrow}>Details →</Text>
          </View>

          {/* Confirmation hint */}
          {jeep.status === 'OPEN' || jeep.status === 'PENDING_PAYMENT' ? (
            <View style={styles.hintRow}>
              <Text style={styles.hintText}>
                {paidCount < 4
                  ? `Need ${4 - paidCount} more paid seat${4 - paidCount !== 1 ? 's' : ''} to confirm`
                  : 'Minimum reached — waiting for all payments'}
              </Text>
            </View>
          ) : null}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        <View style={styles.topRow}>
          <Text style={styles.title}>Shared Safaris</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateSafari')}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: Colors.success, label: 'Paid' },
            { color: Colors.warning, label: 'Reserved' },
            { color: Colors.gray[200], label: 'Empty' },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        {upcoming.length === 0 && past.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚙</Text>
            <Text style={styles.emptyText}>No safaris yet</Text>
            <Text style={styles.emptySubText}>Tap + New to create your first shared safari</Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Upcoming ({upcoming.length})</Text>
                {upcoming.map(renderJeep)}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Past ({past.length})</Text>
                {past.map(renderJeep)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.gray[900] },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: Colors.gray[500] },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.gray[500], marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  jeepCard: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardLeft: {},
  safariType: { fontSize: 17, fontWeight: '700', color: Colors.gray[900] },
  safariDate: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  seatSection: { marginBottom: 12 },
  seatRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  seatDot: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  seatNum: { fontSize: 12, fontWeight: '700', color: Colors.white },
  seatInfo: { fontSize: 12, color: Colors.gray[500] },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  priceText: { fontSize: 13, color: Colors.gray[600] },
  totalText: { fontSize: 13, fontWeight: '700', color: Colors.primary, flex: 1 },
  detailArrow: { fontSize: 13, color: Colors.gray[400] },
  hintRow: { marginTop: 8, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 8 },
  hintText: { fontSize: 12, color: '#92400E' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.gray[700] },
  emptySubText: { fontSize: 14, color: Colors.gray[400], marginTop: 6 },
});
