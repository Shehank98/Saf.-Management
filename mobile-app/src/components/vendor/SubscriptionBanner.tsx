import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { daysUntil } from '../../utils/formatters';

interface SubscriptionBannerProps {
  status: string;
  expiryDate: string | null;
  onRenewPress: () => void;
}

export function SubscriptionBanner({ status, expiryDate, onRenewPress }: SubscriptionBannerProps) {
  if (status === 'ACTIVE' && expiryDate) {
    const days = daysUntil(expiryDate);
    if (days > 7) return null;

    return (
      <View style={[styles.banner, styles.warning]}>
        <Text style={styles.warningText}>
          ⚠️ Subscription expires in {days} day{days !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={onRenewPress}>
          <Text style={styles.actionText}>Renew</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'EXPIRED') {
    return (
      <View style={[styles.banner, styles.error]}>
        <Text style={styles.errorText}>❌ Subscription expired. Renew to accept bookings.</Text>
        <TouchableOpacity onPress={onRenewPress}>
          <Text style={styles.actionText}>Renew Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'PENDING_PAYMENT') {
    return (
      <View style={[styles.banner, styles.info]}>
        <Text style={styles.infoText}>💳 Complete your subscription to start receiving bookings</Text>
        <TouchableOpacity onPress={onRenewPress}>
          <Text style={styles.actionText}>Activate</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, marginBottom: 12 },
  warning: { backgroundColor: '#FEF3C7' },
  error: { backgroundColor: '#FEE2E2' },
  info: { backgroundColor: '#DBEAFE' },
  warningText: { color: '#92400E', fontSize: 13, flex: 1, marginRight: 8 },
  errorText: { color: '#991B1B', fontSize: 13, flex: 1, marginRight: 8 },
  infoText: { color: '#1E40AF', fontSize: 13, flex: 1, marginRight: 8 },
  actionText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
});
