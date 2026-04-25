import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
  Share, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  assignVendors, getAvailableVendors, getPaymentTracking, generateBookingLink,
} from '../../services/owner.service';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Colors } from '../../theme/colors';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props {
  navigation: any;
  route: any;
}

type TabKey = 'bookings' | 'payments' | 'vendors';

function CountdownBadge({ deadlineISO }: { deadlineISO: string | null }) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineISO) return;
    const update = () => {
      const ms = new Date(deadlineISO).getTime() - Date.now();
      setMinutesLeft(Math.max(0, Math.floor(ms / 60000)));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadlineISO]);

  if (minutesLeft === null) return null;

  const urgent = minutesLeft < 60;
  const bg = minutesLeft === 0 ? '#FEE2E2' : urgent ? '#FEF3C7' : '#DCFCE7';
  const color = minutesLeft === 0 ? '#DC2626' : urgent ? '#92400E' : '#166534';
  const label = minutesLeft === 0 ? 'EXPIRED' : minutesLeft < 60
    ? `${minutesLeft}m left`
    : `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`;

  return (
    <View style={[styles.countdownBadge, { backgroundColor: bg }]}>
      <Text style={[styles.countdownText, { color }]}>⏱ {label}</Text>
    </View>
  );
}

export function SafariDetailScreen({ navigation, route }: Props) {
  const { jeep } = route.params;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('bookings');
  const [showAssign, setShowAssign] = useState(false);
  const [assignType, setAssignType] = useState<'GUIDE' | 'JEEP_PROVIDER'>('GUIDE');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [fee, setFee] = useState('');

  const { data: vendors = [] } = useQuery({
    queryKey: ['available-vendors', assignType],
    queryFn: () => getAvailableVendors(assignType),
    enabled: showAssign,
  });

  const {
    data: paymentStatus,
    isLoading: loadingPayments,
    refetch: refetchPayments,
    isRefetching,
  } = useQuery({
    queryKey: ['payment-tracking', jeep.id],
    queryFn: () => getPaymentTracking(jeep.id),
    enabled: activeTab === 'payments',
    refetchInterval: activeTab === 'payments' ? 60000 : false,
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
      Alert.alert('Assigned!', `${assignType === 'GUIDE' ? 'Guide' : 'Jeep'} assigned. They will be notified via WhatsApp.`);
    },
    onError: () => Alert.alert('Error', 'Assignment failed. Please try again.'),
  });

  const bookingLinkMutation = useMutation({
    mutationFn: () => generateBookingLink(jeep.id),
    onSuccess: (data) => {
      Share.share({
        message: `Book your safari seat:\n${data.url}`,
        url: data.url,
      });
    },
    onError: () => Alert.alert('Error', 'Could not generate booking link'),
  });

  const bookings = jeep.bookings || [];
  const paidBookings = bookings.filter((b: any) => b.status === 'PAID' || b.status === 'CONFIRMED');
  const pendingBookings = bookings.filter((b: any) => b.status === 'PAYMENT_PENDING' || b.status === 'RESERVED');
  const totalRevenue = paidBookings.reduce((s: number, b: any) => s + parseFloat(b.totalAmount), 0);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'bookings', label: 'Customers' },
    { key: 'payments', label: 'Payments' },
    { key: 'vendors', label: 'Vendors' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          activeTab === 'payments'
            ? <RefreshControl refreshing={isRefetching} onRefresh={refetchPayments} />
            : undefined
        }
      >
        {/* Safari info header */}
        <Card style={styles.infoCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.safariType}>{jeep.safariType}</Text>
              <Text style={styles.safariDate}>{formatDate(jeep.safariDate)}</Text>
            </View>
            <View style={[styles.jeepStatusBadge, {
              backgroundColor: jeep.status === 'CONFIRMED' ? '#DCFCE7'
                : jeep.status === 'PENDING_PAYMENT' ? '#FEF3C7' : Colors.gray[100],
            }]}>
              <Text style={[styles.jeepStatusText, {
                color: jeep.status === 'CONFIRMED' ? '#166534'
                  : jeep.status === 'PENDING_PAYMENT' ? '#92400E' : Colors.gray[600],
              }]}>{jeep.status}</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: Colors.success }]}>{paidBookings.length}</Text>
              <Text style={styles.statLbl}>Paid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: Colors.warning }]}>{pendingBookings.length}</Text>
              <Text style={styles.statLbl}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: Colors.gray[400] }]}>{6 - bookings.length}</Text>
              <Text style={styles.statLbl}>Empty</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: Colors.primary }]}>{formatCurrency(totalRevenue)}</Text>
              <Text style={styles.statLbl}>Revenue</Text>
            </View>
          </View>
        </Card>

        {/* Seat map */}
        <Card style={styles.seatMapCard}>
          <View style={styles.seatGrid}>
            {Array.from({ length: 6 }, (_, i) => {
              const booking = bookings.find((b: any) => b.seatNumber === i + 1);
              const isPaid = booking?.status === 'PAID' || booking?.status === 'CONFIRMED';
              const isPending = booking?.status === 'PAYMENT_PENDING';
              const isReserved = booking?.status === 'RESERVED';
              return (
                <View key={i} style={[
                  styles.seat,
                  isPaid && styles.seatPaid,
                  isPending && styles.seatPending,
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
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendTxt}>Paying</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.gray[400] }]} /><Text style={styles.legendTxt}>Reserved</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.gray[200] }]} /><Text style={styles.legendTxt}>Empty</Text></View>
          </View>
        </Card>

        {/* Booking link button */}
        <Button
          title={bookingLinkMutation.isPending ? 'Generating...' : 'Share Booking Link'}
          onPress={() => bookingLinkMutation.mutate()}
          loading={bookingLinkMutation.isPending}
          variant="outline"
          style={styles.shareLinkBtn}
        />

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab: Customers */}
        {activeTab === 'bookings' && (
          <>
            {bookings.length === 0 ? (
              <Text style={styles.emptyText}>No bookings yet. Share the booking link to get customers.</Text>
            ) : (
              bookings.map((booking: any) => (
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
                        {
                          backgroundColor:
                            (booking.status === 'PAID' || booking.status === 'CONFIRMED') ? '#DCFCE7'
                            : booking.status === 'PAYMENT_PENDING' ? '#FEF3C7'
                            : Colors.gray[100],
                        },
                      ]}>
                        <Text style={[
                          styles.statusPillText,
                          {
                            color:
                              (booking.status === 'PAID' || booking.status === 'CONFIRMED') ? '#166534'
                              : booking.status === 'PAYMENT_PENDING' ? '#92400E'
                              : Colors.gray[500],
                          },
                        ]}>
                          {booking.status}
                        </Text>
                      </View>
                      <Text style={styles.bookingAmount}>{formatCurrency(parseFloat(booking.totalAmount))}</Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* Tab: Payment Status */}
        {activeTab === 'payments' && (
          <>
            {loadingPayments ? (
              <Text style={styles.emptyText}>Loading payment status...</Text>
            ) : !paymentStatus ? (
              <Text style={styles.emptyText}>No payment data available</Text>
            ) : (
              <>
                {/* Summary */}
                <Card style={styles.paymentSummaryCard}>
                  <View style={styles.paymentSummaryRow}>
                    <View style={styles.paymentStat}>
                      <Text style={[styles.paymentStatNum, { color: Colors.success }]}>{paymentStatus.paidSeats}</Text>
                      <Text style={styles.paymentStatLbl}>Paid</Text>
                    </View>
                    <View style={styles.paymentStat}>
                      <Text style={[styles.paymentStatNum, { color: Colors.warning }]}>
                        {paymentStatus.seats?.filter((s: any) => s.status === 'PAYMENT_PENDING').length || 0}
                      </Text>
                      <Text style={styles.paymentStatLbl}>Pending</Text>
                    </View>
                    <View style={styles.paymentStat}>
                      <Text style={styles.paymentStatNum}>
                        {paymentStatus.seats?.filter((s: any) => s.status === 'RESERVED').length || 0}
                      </Text>
                      <Text style={styles.paymentStatLbl}>Reserved</Text>
                    </View>
                  </View>
                  {paymentStatus.paymentDeadline && (
                    <View style={styles.deadlineRow}>
                      <Text style={styles.deadlineLabel}>Overall deadline:</Text>
                      <CountdownBadge deadlineISO={paymentStatus.paymentDeadline} />
                    </View>
                  )}
                  {paymentStatus.guideName && (
                    <Text style={styles.guideInfo}>👤 Guide: {paymentStatus.guideName}</Text>
                  )}
                </Card>

                {/* Per-seat payment status */}
                {(paymentStatus.seats || []).map((seat: any) => (
                  <Card key={seat.bookingId} style={styles.seatPaymentCard}>
                    <View style={styles.seatPaymentRow}>
                      <View style={styles.seatPaymentLeft}>
                        <View style={styles.seatNumCircle}>
                          <Text style={styles.seatNumText}>#{seat.seatNumber}</Text>
                        </View>
                      </View>
                      <View style={styles.seatPaymentInfo}>
                        <Text style={styles.seatPaymentName}>{seat.customerName}</Text>
                        <Text style={styles.seatPaymentPhone}>{seat.customerPhone}</Text>
                        <Text style={styles.seatPaymentAmount}>{formatCurrency(parseFloat(seat.amount))}</Text>
                      </View>
                      <View style={styles.seatPaymentStatus}>
                        {seat.status === 'PAID' || seat.status === 'CONFIRMED' ? (
                          <View style={[styles.statusPill, { backgroundColor: '#DCFCE7' }]}>
                            <Text style={[styles.statusPillText, { color: '#166534' }]}>✓ PAID</Text>
                          </View>
                        ) : seat.status === 'PAYMENT_PENDING' ? (
                          <>
                            <View style={[styles.statusPill, { backgroundColor: '#FEF3C7' }]}>
                              <Text style={[styles.statusPillText, { color: '#92400E' }]}>PENDING</Text>
                            </View>
                            {seat.paymentDeadline && (
                              <CountdownBadge deadlineISO={seat.paymentDeadline} />
                            )}
                          </>
                        ) : (
                          <View style={[styles.statusPill, { backgroundColor: Colors.gray[100] }]}>
                            <Text style={[styles.statusPillText, { color: Colors.gray[500] }]}>RESERVED</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                ))}

                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={() => refetchPayments()}
                >
                  <Text style={styles.refreshBtnText}>↻ Refresh Status</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Tab: Vendors */}
        {activeTab === 'vendors' && (
          <>
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
                  {jeep.jeepAssignment?.vendor?.user?.name || 'Not assigned'}{jeep.jeepAssignment ? ` · ${jeep.jeepAssignment.jeepNumber}` : ''}
                </Text>
              </View>
            </Card>

            {jeep.status === 'CONFIRMED' ? (
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
            ) : (
              <View style={styles.noAssignHint}>
                <Text style={styles.noAssignText}>
                  Vendor assignment available once the safari is confirmed (4+ paid seats).
                </Text>
              </View>
            )}
          </>
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
  scroll: { padding: 16, paddingBottom: 32 },
  infoCard: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  safariType: { fontSize: 20, fontWeight: '800', color: Colors.gray[900] },
  safariDate: { fontSize: 13, color: Colors.gray[500], marginTop: 3 },
  jeepStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  jeepStatusText: { fontSize: 11, fontWeight: '700' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '800', color: Colors.gray[900] },
  statLbl: { fontSize: 11, color: Colors.gray[400], marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  seatMapCard: { marginBottom: 12 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  seat: { width: '30%', borderRadius: 10, padding: 10, alignItems: 'center' },
  seatEmpty: { backgroundColor: Colors.gray[100] },
  seatPaid: { backgroundColor: '#DCFCE7' },
  seatPending: { backgroundColor: '#FEF3C7' },
  seatReserved: { backgroundColor: Colors.gray[200] },
  seatIcon: { fontSize: 22 },
  seatLabel: { fontSize: 11, fontWeight: '700', color: Colors.gray[600], marginTop: 2 },
  seatName: { fontSize: 10, color: Colors.gray[500], marginTop: 1 },
  seatLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: 11, color: Colors.gray[500] },
  shareLinkBtn: { marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.gray[100], borderRadius: 12, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.gray[500] },
  activeTabText: { color: Colors.gray[900] },
  emptyText: { textAlign: 'center', color: Colors.gray[400], marginTop: 30, fontSize: 14 },
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
  paymentSummaryCard: { marginBottom: 12 },
  paymentSummaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  paymentStat: { alignItems: 'center' },
  paymentStatNum: { fontSize: 22, fontWeight: '800', color: Colors.gray[900] },
  paymentStatLbl: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  deadlineLabel: { fontSize: 13, color: Colors.gray[500] },
  guideInfo: { fontSize: 13, color: Colors.gray[600], marginTop: 8 },
  countdownBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countdownText: { fontSize: 12, fontWeight: '700' },
  seatPaymentCard: { marginBottom: 8 },
  seatPaymentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seatPaymentLeft: { alignItems: 'center' },
  seatNumCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray[100], justifyContent: 'center', alignItems: 'center' },
  seatNumText: { fontSize: 11, fontWeight: '800', color: Colors.gray[700] },
  seatPaymentInfo: { flex: 1 },
  seatPaymentName: { fontSize: 14, fontWeight: '700', color: Colors.gray[900] },
  seatPaymentPhone: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  seatPaymentAmount: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginTop: 2 },
  seatPaymentStatus: { alignItems: 'flex-end', gap: 4 },
  refreshBtn: { marginTop: 12, alignItems: 'center', padding: 12 },
  refreshBtnText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
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
