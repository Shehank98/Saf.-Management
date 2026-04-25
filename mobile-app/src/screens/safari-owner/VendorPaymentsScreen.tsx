import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorPayments, markVendorPaid } from '../../services/owner.service';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function VendorPaymentsScreen() {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-payments'],
    queryFn: getVendorPayments,
  });

  const markPaidMutation = useMutation({
    mutationFn: (paymentId: string) => markVendorPaid(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payments'] });
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] });
    },
    onError: () => Alert.alert('Error', 'Failed to mark payment. Please try again.'),
  });

  const handleMarkPaid = (payment: any) => {
    Alert.alert(
      'Mark as Paid',
      `Confirm payment of ${formatCurrency(parseFloat(payment.amount))} to ${payment.vendor?.user?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => markPaidMutation.mutate(payment.id) },
      ]
    );
  };

  if (isLoading) return <SafariLoader text="Loading payments..." />;

  const pending = payments.filter((p: any) => p.status === 'PENDING');
  const paid = payments.filter((p: any) => p.status === 'PAID');
  const totalPending = pending.reduce((s: number, p: any) => s + parseFloat(p.amount), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        <Text style={styles.title}>Vendor Payments</Text>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.summaryIcon}>⏳</Text>
            <Text style={[styles.summaryAmount, { color: Colors.error }]}>
              {formatCurrency(totalPending)}
            </Text>
            <Text style={styles.summaryLabel}>{pending.length} Pending</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={styles.summaryIcon}>✅</Text>
            <Text style={[styles.summaryAmount, { color: Colors.success }]}>
              {formatCurrency(paid.reduce((s: number, p: any) => s + parseFloat(p.amount), 0))}
            </Text>
            <Text style={styles.summaryLabel}>{paid.length} Paid</Text>
          </Card>
        </View>

        {/* Pending payments */}
        {pending.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Pending</Text>
            {pending.map((payment: any) => (
              <Card key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.vendorName}>{payment.vendor?.user?.name}</Text>
                    <Text style={styles.vendorBusiness}>{payment.vendor?.businessName}</Text>
                    <Text style={styles.description}>{payment.description}</Text>
                    <Text style={styles.date}>{formatDate(payment.createdAt)}</Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.amount}>{formatCurrency(parseFloat(payment.amount))}</Text>
                    <TouchableOpacity
                      onPress={() => handleMarkPaid(payment)}
                      disabled={markPaidMutation.isPending}
                      style={styles.markPaidBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.markPaidText}>Mark Paid</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Paid history */}
        {paid.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Paid History</Text>
            {paid.map((payment: any) => (
              <Card key={payment.id} style={[styles.paymentCard, styles.paidCard]}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.vendorName}>{payment.vendor?.user?.name}</Text>
                    <Text style={styles.description}>{payment.description}</Text>
                    <Text style={styles.date}>Paid {payment.paidAt ? formatDate(payment.paidAt) : ''}</Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={[styles.amount, { color: Colors.success }]}>
                      {formatCurrency(parseFloat(payment.amount))}
                    </Text>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>PAID</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {payments.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>No vendor payments yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.gray[900], marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, alignItems: 'center', padding: 16, borderWidth: 0 },
  summaryIcon: { fontSize: 28, marginBottom: 6 },
  summaryAmount: { fontSize: 16, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: Colors.gray[500], marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.gray[500], marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  paymentCard: { marginBottom: 10 },
  paidCard: { opacity: 0.75 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  paymentInfo: { flex: 1, marginRight: 12 },
  vendorName: { fontSize: 15, fontWeight: '700', color: Colors.gray[900] },
  vendorBusiness: { fontSize: 12, color: Colors.gray[500], marginTop: 1 },
  description: { fontSize: 13, color: Colors.gray[600], marginTop: 4 },
  date: { fontSize: 11, color: Colors.gray[400], marginTop: 3 },
  paymentRight: { alignItems: 'flex-end', gap: 8 },
  amount: { fontSize: 17, fontWeight: '800', color: Colors.gray[900] },
  markPaidBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  markPaidText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  paidBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  paidBadgeText: { color: Colors.success, fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 16, color: Colors.gray[400] },
});
