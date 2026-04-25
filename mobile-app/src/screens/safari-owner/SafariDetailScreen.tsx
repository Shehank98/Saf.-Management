import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignVendors, getAvailableVendors } from '../../services/owner.service';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Colors } from '../../theme/colors';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props {
  navigation: any;
  route: any;
}

export function SafariDetailScreen({ navigation, route }: Props) {
  const { jeep } = route.params;
  const queryClient = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const [assignType, setAssignType] = useState<'GUIDE' | 'JEEP_PROVIDER'>('GUIDE');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [fee, setFee] = useState('');

  const { data: vendors = [] } = useQuery({
    queryKey: ['available-vendors', assignType],
    queryFn: () => getAvailableVendors(assignType),
    enabled: showAssign,
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      const payload =
        assignType === 'GUIDE'
          ? { guideVendorId: selectedVendor.id, guideFee: parseFloat(fee) }
          : { jeepVendorId: selectedVendor.id, jeepRentalFee: parseFloat(fee), jeepNumber: 'TBD' };
      return assignVendors(jeep.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-jeeps'] });
      setShowAssign(false);
      setSelectedVendor(null);
      setFee('');
      Alert.alert('Assigned!', `${assignType === 'GUIDE' ? 'Guide' : 'Jeep'} assigned successfully. They will be notified via WhatsApp.`);
    },
    onError: () => Alert.alert('Error', 'Assignment failed. Please try again.'),
  });

  const bookings = jeep.bookings || [];
  const paidBookings = bookings.filter((b: any) => b.status === 'PAID' || b.status === 'CONFIRMED');
  const totalRevenue = paidBookings.reduce((s: number, b: any) => s + parseFloat(b.totalAmount), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Safari info */}
        <Card style={styles.infoCard}>
          <Text style={styles.safariType}>{jeep.safariType}</Text>
          <Text style={styles.safariDate}>{formatDate(jeep.safariDate)}</Text>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{paidBookings.length}</Text>
              <Text style={styles.statLbl}>Paid Seats</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{bookings.length - paidBookings.length}</Text>
              <Text style={styles.statLbl}>Reserved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: Colors.primary }]}>
                {formatCurrency(totalRevenue)}
              </Text>
              <Text style={styles.statLbl}>Revenue</Text>
            </View>
          </View>
        </Card>

        {/* Seat map */}
        <Text style={styles.sectionTitle}>Seat Map</Text>
        <Card style={styles.seatMapCard}>
          <View style={styles.seatGrid}>
            {Array.from({ length: 6 }, (_, i) => {
              const booking = bookings.find((b: any) => b.seatNumber === i + 1);
              const isPaid = booking?.status === 'PAID' || booking?.status === 'CONFIRMED';
              const isReserved = booking && !isPaid;
              return (
                <View key={i} style={[
                  styles.seat,
                  isPaid && styles.seatPaid,
                  isReserved && styles.seatReserved,
                  !booking && styles.seatEmpty,
                ]}>
                  <Text style={styles.seatIcon}>💺</Text>
                  <Text style={styles.seatLabel}>#{i + 1}</Text>
                  {booking && (
                    <Text style={styles.seatName} numberOfLines={1}>
                      {booking.customer?.user?.name?.split(' ')[0] || '?'}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.seatLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.success }]} /><Text style={styles.legendTxt}>Paid</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.warning }]} /><Text style={styles.legendTxt}>Reserved</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.gray[200] }]} /><Text style={styles.legendTxt}>Empty</Text></View>
          </View>
        </Card>

        {/* Customer list */}
        {bookings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Customers</Text>
            {bookings.map((booking: any) => (
              <Card key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingRow}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingName}>{booking.customer?.user?.name}</Text>
                    <Text style={styles.bookingPhone}>{booking.customer?.user?.phone}</Text>
                    <Text style={styles.bookingPickup}>📍 {booking.pickupLocation} · {booking.pickupTime}</Text>
                    {booking.mealIncluded && (
                      <Text style={styles.bookingMeal}>🍽️ {booking.mealTypes?.join(', ')}</Text>
                    )}
                  </View>
                  <View style={styles.bookingRight}>
                    <Text style={styles.seatBadge}>Seat #{booking.seatNumber}</Text>
                    <View style={[
                      styles.statusPill,
                      { backgroundColor: (booking.status === 'PAID' || booking.status === 'CONFIRMED') ? '#DCFCE7' : '#FEF3C7' },
                    ]}>
                      <Text style={[
                        styles.statusPillText,
                        { color: (booking.status === 'PAID' || booking.status === 'CONFIRMED') ? '#166534' : '#92400E' },
                      ]}>
                        {booking.status}
                      </Text>
                    </View>
                    <Text style={styles.bookingAmount}>{formatCurrency(parseFloat(booking.totalAmount))}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Vendor assignments */}
        <Text style={styles.sectionTitle}>Vendor Assignments</Text>
        <Card style={styles.vendorCard}>
          <View style={styles.vendorRow}>
            <Text style={styles.vendorLabel}>Guide</Text>
            <Text style={styles.vendorValue}>
              {jeep.guideAssignment?.vendor?.user?.name || 'Not assigned'}
            </Text>
          </View>
          <View style={[styles.vendorRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.vendorLabel}>Jeep</Text>
            <Text style={styles.vendorValue}>
              {jeep.jeepAssignment?.vendor?.user?.name || 'Not assigned'}
            </Text>
          </View>
        </Card>

        {jeep.status === 'CONFIRMED' && (
          <View style={styles.assignBtns}>
            <Button
              title="Assign Guide"
              onPress={() => { setAssignType('GUIDE'); setShowAssign(true); }}
              variant="outline"
              style={styles.assignBtn}
            />
            <Button
              title="Assign Jeep"
              onPress={() => { setAssignType('JEEP_PROVIDER'); setShowAssign(true); }}
              variant="outline"
              style={styles.assignBtn}
            />
          </View>
        )}
        {jeep.status !== 'CONFIRMED' && (
          <View style={styles.noAssignHint}>
            <Text style={styles.noAssignText}>
              Vendor assignment is available once the safari is confirmed (4+ paid seats).
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Vendor selection modal */}
      <Modal visible={showAssign} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {assignType === 'GUIDE' ? 'Guide' : 'Jeep Provider'}</Text>
            <TouchableOpacity onPress={() => setShowAssign(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {vendors.length === 0 ? (
              <Text style={styles.noVendors}>No available vendors found</Text>
            ) : (
              vendors.map((vendor: any) => (
                <TouchableOpacity
                  key={vendor.id}
                  onPress={() => setSelectedVendor(vendor)}
                  style={[styles.vendorOption, selectedVendor?.id === vendor.id && styles.selectedVendorOption]}
                >
                  <View>
                    <Text style={styles.vendorName}>{vendor.businessName}</Text>
                    <Text style={styles.vendorContact}>{vendor.user?.name} · {vendor.user?.phone}</Text>
                    {vendor.averageRating && (
                      <Text style={styles.vendorRating}>⭐ {parseFloat(vendor.averageRating).toFixed(1)}</Text>
                    )}
                  </View>
                  {selectedVendor?.id === vendor.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            )}

            {selectedVendor && (
              <View style={styles.feeInput}>
                <Text style={styles.feeLabel}>
                  {assignType === 'GUIDE' ? 'Guide Fee' : 'Rental Fee'} (LKR)
                </Text>
                <View style={styles.feeRow}>
                  <Text style={styles.feePrefix}>LKR</Text>
                  {React.createElement(require('react-native').TextInput, {
                    style: styles.feeTextInput,
                    value: fee,
                    onChangeText: setFee,
                    placeholder: 'e.g. 2500',
                    placeholderTextColor: Colors.gray[400],
                    keyboardType: 'numeric',
                  })}
                </View>
              </View>
            )}

            {selectedVendor && parseFloat(fee) > 0 && (
              <Button
                title={assignMutation.isPending ? 'Assigning...' : `Assign ${selectedVendor.businessName}`}
                onPress={() => assignMutation.mutate()}
                loading={assignMutation.isPending}
                style={styles.confirmAssignBtn}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  infoCard: { marginBottom: 20 },
  safariType: { fontSize: 22, fontWeight: '800', color: Colors.gray[900] },
  safariDate: { fontSize: 14, color: Colors.gray[500], marginTop: 4, marginBottom: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: Colors.gray[900] },
  statLbl: { fontSize: 11, color: Colors.gray[400], marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray[900], marginBottom: 10 },
  seatMapCard: { marginBottom: 20 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  seat: { width: '30%', borderRadius: 10, padding: 10, alignItems: 'center' },
  seatEmpty: { backgroundColor: Colors.gray[100] },
  seatPaid: { backgroundColor: '#DCFCE7' },
  seatReserved: { backgroundColor: '#FEF3C7' },
  seatIcon: { fontSize: 22 },
  seatLabel: { fontSize: 11, fontWeight: '700', color: Colors.gray[600], marginTop: 2 },
  seatName: { fontSize: 10, color: Colors.gray[500], marginTop: 1 },
  seatLegend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: 11, color: Colors.gray[500] },
  bookingCard: { marginBottom: 8 },
  bookingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bookingInfo: { flex: 1, marginRight: 10 },
  bookingName: { fontSize: 14, fontWeight: '700', color: Colors.gray[900] },
  bookingPhone: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  bookingPickup: { fontSize: 12, color: Colors.gray[600], marginTop: 3 },
  bookingMeal: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  bookingRight: { alignItems: 'flex-end', gap: 4 },
  seatBadge: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  bookingAmount: { fontSize: 14, fontWeight: '800', color: Colors.gray[900] },
  vendorCard: { marginBottom: 12 },
  vendorRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  vendorLabel: { fontSize: 14, color: Colors.gray[500] },
  vendorValue: { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  assignBtns: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  assignBtn: { flex: 1 },
  noAssignHint: { backgroundColor: Colors.gray[100], borderRadius: 10, padding: 12, marginBottom: 20 },
  noAssignText: { fontSize: 13, color: Colors.gray[500], textAlign: 'center' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.gray[900] },
  modalClose: { fontSize: 18, color: Colors.gray[500], padding: 4 },
  modalScroll: { padding: 20 },
  noVendors: { textAlign: 'center', color: Colors.gray[400], marginTop: 40 },
  vendorOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10, backgroundColor: Colors.white },
  selectedVendorOption: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  vendorName: { fontSize: 15, fontWeight: '700', color: Colors.gray[900] },
  vendorContact: { fontSize: 13, color: Colors.gray[500], marginTop: 3 },
  vendorRating: { fontSize: 12, color: Colors.warning, marginTop: 2 },
  checkmark: { fontSize: 18, color: Colors.primary, fontWeight: '800' },
  feeInput: { marginTop: 8, marginBottom: 16 },
  feeLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 8 },
  feeRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, overflow: 'hidden' },
  feePrefix: { paddingHorizontal: 14, paddingVertical: 13, backgroundColor: Colors.gray[50], color: Colors.gray[600], fontWeight: '600', borderRightWidth: 1, borderRightColor: Colors.border },
  feeTextInput: { flex: 1, padding: 13, fontSize: 15, color: Colors.gray[900] },
  confirmAssignBtn: { marginBottom: 32 },
});
