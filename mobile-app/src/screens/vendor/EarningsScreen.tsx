import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getEarnings } from '../../services/vendor.service';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatCurrency, formatDate } from '../../utils/formatters';

type Period = 'month' | 'year' | 'all';

export function EarningsScreen() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-earnings', period],
    queryFn: () => getEarnings(period),
  });

  if (isLoading) return <SafariLoader text="Loading earnings..." />;

  const total = data?.total || 0;
  const payments: any[] = data?.payments || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Earnings</Text>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(['month', 'year', 'all'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, period === p && styles.activePeriod]}
            >
              <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
                {p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Card */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earned</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          <Text style={styles.totalCount}>{payments.length} payment{payments.length !== 1 ? 's' : ''}</Text>
        </Card>

        {/* Payments List */}
        <Text style={styles.sectionTitle}>Payment History</Text>
        {payments.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No payments recorded yet</Text>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDesc}>{payment.description}</Text>
                  <Text style={styles.paymentDate}>{payment.paidAt ? formatDate(payment.paidAt) : 'Pending'}</Text>
                </View>
                <Text style={styles.paymentAmount}>{formatCurrency(parseFloat(payment.amount))}</Text>
              </View>
              <View style={[
                styles.statusDot,
                { backgroundColor: payment.status === 'PAID' ? Colors.success : Colors.warning }
              ]}>
                <Text style={styles.statusText}>{payment.status}</Text>
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
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 16 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  activePeriod: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  periodText: { fontSize: 12, fontWeight: '600', color: Colors.gray[600] },
  activePeriodText: { color: Colors.primary },
  totalCard: { backgroundColor: Colors.primary, alignItems: 'center', padding: 24, marginBottom: 24 },
  totalLabel: { fontSize: 13, color: '#86efac' },
  totalValue: { fontSize: 36, fontWeight: '900', color: Colors.white, marginVertical: 4 },
  totalCount: { fontSize: 12, color: '#86efac' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 12 },
  paymentCard: { marginBottom: 10 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  paymentInfo: { flex: 1, marginRight: 12 },
  paymentDesc: { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  paymentDate: { fontSize: 12, color: Colors.gray[400], marginTop: 3 },
  paymentAmount: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  statusDot: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 8 },
  statusText: { fontSize: 11, color: Colors.white, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: Colors.gray[400], fontSize: 14, paddingVertical: 8 },
});
