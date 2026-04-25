import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatDate, formatCurrency, daysUntil } from '../../utils/formatters';

interface Props { navigation: any; route: any; }

export function JobDetailScreen({ route }: Props) {
  const { job } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const safari     = job.sharedJeep || job.privateSafari;
  const isShared   = !!job.sharedJeep;
  const safariType = job.type; // 'jeep' | 'guide'
  const fee        = safariType === 'jeep' ? job.rentalFee : job.guideFee;
  const bookings   = job.sharedJeep?.bookings || [];
  const owner      = job.sharedJeep?.owner?.user || job.privateSafari?.booking?.customer?.user;
  const days       = safari?.safariDate ? daysUntil(safari.safariDate) : null;

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const callPhone = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Hero banner */}
          <View style={[styles.hero, { backgroundColor: isShared ? Colors.primary : Colors.secondary }]}>
            <Text style={styles.heroLabel}>{isShared ? '🚙 Shared Safari' : '👑 Private Safari'}</Text>
            <Text style={styles.heroType}>{safari?.safariType || 'Safari'}</Text>
            <Text style={styles.heroDate}>{safari?.safariDate ? formatDate(safari.safariDate) : '—'}</Text>
            {days !== null && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  {days === 0 ? '🔥 TODAY' : days === 1 ? '⏰ Tomorrow' : `📅 ${days} days away`}
                </Text>
              </View>
            )}
          </View>

          {/* Your assignment */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Your Assignment</Text>
            <InfoRow icon={safariType === 'jeep' ? '🚙' : '🧭'} label="Role" value={safariType === 'jeep' ? 'Jeep Provider' : 'Safari Guide'} />
            {safariType === 'jeep' && job.jeepNumber && (
              <InfoRow icon="🔢" label="Vehicle Number" value={job.jeepNumber} />
            )}
            <InfoRow icon="💰" label="Your Fee" value={formatCurrency(parseFloat(fee))} />
            <InfoRow icon="💳" label="Payment Status" value={job.paymentStatus === 'PAID' ? '✅ Paid' : '⏳ After safari completion'} />
          </Card>

          {/* Safari details */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Safari Details</Text>
            <InfoRow icon="🦁" label="Type"     value={safari?.safariType || '—'} />
            <InfoRow icon="📅" label="Date"     value={safari?.safariDate ? formatDate(safari.safariDate) : '—'} />
            <InfoRow icon="⏰" label="Pickup"   value="5:45 AM (standard)" />
          </Card>

          {/* Owner/contact */}
          {owner && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Owner Contact</Text>
              <View style={styles.contactRow}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>{(owner.name || 'O')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{owner.name}</Text>
                  <Text style={styles.contactPhone}>{owner.phone || 'No phone'}</Text>
                </View>
                {owner.phone && (
                  <TouchableOpacity onPress={() => callPhone(owner.phone)} style={styles.callBtn}>
                    <Text style={styles.callBtnText}>📞 Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}

          {/* Guests (shared safari) */}
          {isShared && bookings.length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Guests ({bookings.length})</Text>
              {bookings.map((booking: any, i: number) => (
                <View key={booking.id} style={styles.guestRow}>
                  <View style={styles.guestSeat}>
                    <Text style={styles.guestSeatText}>{booking.seatNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guestName}>
                      {booking.customer?.user?.name || `Guest ${i + 1}`}
                    </Text>
                    {booking.mealIncluded && (
                      <Text style={styles.guestMeal}>🍽️ Meal: {booking.mealTypes?.join(', ') || 'Yes'}</Text>
                    )}
                    {booking.dietaryReqs?.length > 0 && (
                      <Text style={styles.guestDiet}>🌿 {booking.dietaryReqs.join(', ')}</Text>
                    )}
                    {booking.cameraNeeded && (
                      <Text style={styles.guestCamera}>📷 Camera rental</Text>
                    )}
                  </View>
                  <Text style={styles.guestPickup}>📍 {booking.pickupTime || '—'}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Preparation checklist */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Preparation Checklist</Text>
            {[
              'Confirm vehicle readiness',
              'Check fuel level',
              'Review pickup locations',
              'Review guest meal requirements',
              'Confirm with owner 24h before',
            ].map((item, i) => (
              <View key={i} style={styles.checkItem}>
                <Text style={styles.checkIcon}>☐</Text>
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </Card>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.background },
  scroll:            { paddingBottom: 40 },
  hero:              { padding: 28, alignItems: 'center' },
  heroLabel:         { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  heroType:          { fontSize: 24, fontWeight: '900', color: Colors.white },
  heroDate:          { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  heroBadge:         { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText:     { color: Colors.white, fontSize: 13, fontWeight: '700' },
  card:              { margin: 16, marginBottom: 0, marginTop: 12 },
  cardTitle:         { fontSize: 14, fontWeight: '700', color: Colors.gray[700], marginBottom: 14 },
  infoRow:           { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  infoIcon:          { fontSize: 18, width: 24, textAlign: 'center' },
  infoLabel:         { fontSize: 11, color: Colors.gray[400] },
  infoValue:         { fontSize: 14, fontWeight: '600', color: Colors.gray[800], marginTop: 1 },
  contactRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactAvatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  contactName:       { fontSize: 15, fontWeight: '700', color: Colors.gray[900] },
  contactPhone:      { fontSize: 13, color: Colors.gray[500] },
  callBtn:           { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  callBtnText:       { color: Colors.white, fontWeight: '700', fontSize: 13 },
  guestRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  guestSeat:         { width: 28, height: 28, backgroundColor: Colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  guestSeatText:     { color: Colors.white, fontSize: 12, fontWeight: '700' },
  guestName:         { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  guestMeal:         { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  guestDiet:         { fontSize: 12, color: Colors.success, marginTop: 1 },
  guestCamera:       { fontSize: 12, color: Colors.info, marginTop: 1 },
  guestPickup:       { fontSize: 11, color: Colors.gray[400] },
  checkItem:         { flexDirection: 'row', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  checkIcon:         { fontSize: 16, color: Colors.gray[400] },
  checkText:         { fontSize: 14, color: Colors.gray[700] },
});
