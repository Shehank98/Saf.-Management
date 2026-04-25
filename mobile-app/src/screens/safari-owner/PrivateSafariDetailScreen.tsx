import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api.service';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props { navigation: any; route: any; }

const STATUS_ACTIONS: Record<string, { next: string; label: string; color: string }[]> = {
  INQUIRY:         [{ next: 'DEPOSIT_PENDING', label: 'Request Deposit', color: Colors.warning }],
  DEPOSIT_PENDING: [{ next: 'DEPOSIT_PAID', label: 'Mark Deposit Paid', color: Colors.success }],
  DEPOSIT_PAID:    [{ next: 'CONFIRMED', label: 'Confirm Safari', color: Colors.primary }],
  CONFIRMED:       [{ next: 'COMPLETED', label: 'Mark Completed', color: Colors.success }],
};

export function PrivateSafariDetailScreen({ navigation, route }: Props) {
  const { safariId } = route.params;
  const qc = useQueryClient();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data: safari, isLoading } = useQuery({
    queryKey: ['private-safari', safariId],
    queryFn: async () => {
      const res = await api.get(`/private-safari/${safariId}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isLoading]);

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/private-safari/${safariId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private-safari', safariId] });
      qc.invalidateQueries({ queryKey: ['private-safaris'] });
    },
    onError: () => Alert.alert('Error', 'Failed to update status.'),
  });

  if (isLoading) return <SafariLoader text="Loading safari..." />;
  if (!safari)   return <SafeAreaView style={styles.container}><Text style={styles.errorText}>Safari not found.</Text></SafeAreaView>;

  const customer = safari.booking?.customer?.user;
  const guide    = safari.guideAssignment?.vendor?.user;
  const jeep     = safari.jeepAssignment;
  const actions  = STATUS_ACTIONS[safari.status] || [];

  const InfoRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && { color: Colors.primary }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Status banner */}
          <View style={[styles.statusBanner, { backgroundColor: safari.status === 'CONFIRMED' ? Colors.primary : Colors.secondary }]}>
            <Text style={styles.bannerType}>{safari.safariType} Safari</Text>
            <Text style={styles.bannerDate}>{formatDate(safari.safariDate)}</Text>
            <Text style={styles.bannerStatus}>{safari.status.replace('_', ' ')}</Text>
          </View>

          {/* Customer */}
          {customer && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>👤 Customer</Text>
              <InfoRow label="Name"  value={customer.name} />
              <InfoRow label="Phone" value={customer.phone || '—'} />
              <InfoRow label="Email" value={customer.email || '—'} />
              {safari.booking?.specialRequests && (
                <InfoRow label="Requests" value={safari.booking.specialRequests} />
              )}
            </Card>
          )}

          {/* Safari details */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>🦁 Safari Details</Text>
            <InfoRow label="Type"     value={safari.safariType} />
            <InfoRow label="Date"     value={formatDate(safari.safariDate)} />
            <InfoRow label="Guests"   value={`${safari.numberOfGuests} people`} />
            <InfoRow label="Status"   value={safari.status.replace(/_/g, ' ')} />
          </Card>

          {/* Financials */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>💰 Financials</Text>
            <InfoRow label="Total Package"  value={formatCurrency(parseFloat(safari.totalAmount))} highlight />
            <InfoRow label="Deposit (30%)"  value={formatCurrency(parseFloat(safari.depositAmount))} />
            <InfoRow label="Deposit Status" value={safari.depositPaid ? '✅ Paid' : '⏳ Pending'} />
            <InfoRow label="Final Payment"  value={safari.finalPaid ? '✅ Paid' : '⏳ Pending'} />
            {safari.vendorCosts > 0 && (
              <InfoRow label="Vendor Costs" value={formatCurrency(parseFloat(safari.vendorCosts))} />
            )}
            {safari.profit > 0 && (
              <InfoRow label="Your Profit" value={formatCurrency(parseFloat(safari.profit))} highlight />
            )}
          </Card>

          {/* Vendors */}
          {(guide || jeep) && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>🔧 Assigned Vendors</Text>
              {guide && (
                <>
                  <InfoRow label="Guide" value={guide.name} />
                  <InfoRow label="Guide Fee" value={formatCurrency(parseFloat(safari.guideAssignment.guideFee))} />
                </>
              )}
              {jeep && (
                <>
                  <InfoRow label="Jeep #" value={jeep.jeepNumber} />
                  <InfoRow label="Rental Fee" value={formatCurrency(parseFloat(jeep.rentalFee))} />
                </>
              )}
            </Card>
          )}

          {/* Assign Vendors CTA */}
          {!guide && !jeep && safari.status !== 'COMPLETED' && safari.status !== 'CANCELLED' && (
            <TouchableOpacity
              onPress={() => Alert.alert('Assign Vendors', 'Vendor assignment coming soon. Contact vendors directly for now.')}
              style={styles.assignBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.assignBtnText}>🔧 Assign Vendors</Text>
            </TouchableOpacity>
          )}

          {/* Status actions */}
          {actions.length > 0 && (
            <View style={styles.actionsRow}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.next}
                  onPress={() => Alert.alert(
                    action.label,
                    `Change status to "${action.next.replace(/_/g, ' ')}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Confirm', onPress: () => statusMutation.mutate(action.next) },
                    ],
                  )}
                  style={[styles.actionBtn, { backgroundColor: action.color }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { paddingBottom: 40 },
  errorText:     { textAlign: 'center', color: Colors.gray[400], fontSize: 16, marginTop: 40 },
  statusBanner:  { padding: 24, alignItems: 'center', marginBottom: 16 },
  bannerType:    { fontSize: 22, fontWeight: '800', color: Colors.white },
  bannerDate:    { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  bannerStatus:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  card:          { marginHorizontal: 16, marginBottom: 12 },
  cardTitle:     { fontSize: 14, fontWeight: '700', color: Colors.gray[700], marginBottom: 12 },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  infoLabel:     { fontSize: 13, color: Colors.gray[500] },
  infoValue:     { fontSize: 13, fontWeight: '600', color: Colors.gray[800], flex: 1, textAlign: 'right' },
  assignBtn:     { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: Colors.secondary, marginBottom: 12 },
  assignBtnText: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  actionsRow:    { padding: 16, gap: 10 },
  actionBtn:     { padding: 16, borderRadius: 14, alignItems: 'center' },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
