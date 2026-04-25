import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getOwnerRevenue } from '../../services/owner.service';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatCurrency, formatDate } from '../../utils/formatters';

type Period = 'month' | 'all';

export function RevenueScreen() {
  const [period, setPeriod] = useState<Period>('month');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['owner-revenue'],
    queryFn: getOwnerRevenue,
  });

  if (isLoading) return <SafariLoader text="Loading revenue..." />;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = period === 'month'
    ? payments.filter((p: any) => p.paidAt && new Date(p.paidAt) >= monthStart)
    : payments;

  const total = filtered.reduce((s: number, p: any) => s + parseFloat(p.totalAmount), 0);

  // Group by safari type
  const byType: Record<string, number> = {};
  filtered.forEach((p: any) => {
    const type = p.jeep?.safariType || 'Unknown';
    byType[type] = (byType[type] || 0) + parseFloat(p.totalAmount);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Revenue</Text>

        <View style={styles.periodRow}>
          {(['month', 'all'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, period === p && styles.activePeriod]}
            >
              <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
                {p === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Revenue</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          <Text style={styles.totalCount}>{filtered.length} bookings</Text>
        </Card>

        {/* By type */}
        {Object.keys(byType).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>By Safari Type</Text>
            {Object.entries(byType).map(([type, amount]) => (
              <Card key={type} style={styles.typeCard}>
                <View style={styles.typeRow}>
                  <Text style={styles.typeName}>{type}</Text>
                  <Text style={styles.typeAmount}>{formatCurrency(amount)}</Text>
                </View>
                <View style={styles.typeBar}>
                  <View style={[styles.typeBarFill, { width: `${Math.round((amount / total) * 100)}%` }]} />
                </View>
                <Text style={styles.typePercent}>{Math.round((amount / total) * 100)}%</Text>
              </Card>
            ))}
          </>
        )}

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Transactions</Text>
        {filtered.length === 0 ? (
          <Card><Text style={styles.emptyText}>No transactions yet</Text></Card>
        ) : (
          filtered.slice(0, 30).map((payment: any, i: number) => (
            <Card key={i} style={styles.txCard}>
              <View style={styles.txRow}>
                <View>
                  <Text style={styles.txType}>{payment.jeep?.safariType || 'Safari'}</Text>
                  <Text style={styles.txDate}>{payment.paidAt ? formatDate(payment.paidAt) : '—'}</Text>
                </View>
                <Text style={styles.txAmount}>{formatCurrency(parseFloat(payment.totalAmount))}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.gray[900], marginBottom: 16 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  activePeriod: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  periodText: { fontSize: 13, fontWeight: '600', color: Colors.gray[600] },
  activePeriodText: { color: Colors.primary },
  totalCard: { backgroundColor: Colors.primary, alignItems: 'center', padding: 24, marginBottom: 20, borderWidth: 0 },
  totalLabel: { fontSize: 13, color: '#86efac' },
  totalValue: { fontSize: 34, fontWeight: '900', color: Colors.white, marginVertical: 4 },
  totalCount: { fontSize: 12, color: '#86efac' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray[900], marginBottom: 10 },
  typeCard: { marginBottom: 8 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeName: { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  typeAmount: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  typeBar: { height: 6, backgroundColor: Colors.gray[100], borderRadius: 3, marginBottom: 4 },
  typeBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  typePercent: { fontSize: 11, color: Colors.gray[400] },
  txCard: { marginBottom: 8 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txType: { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  txDate: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: Colors.gray[900] },
  emptyText: { textAlign: 'center', color: Colors.gray[400], fontSize: 14, padding: 8 },
});
