import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paySubscription } from '../../services/vendor.service';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';
import { SUBSCRIPTION_FEATURES, SUBSCRIPTION_FEES } from '../../utils/constants';

interface Props {
  navigation: any;
}

export function SubscriptionScreen({ navigation }: Props) {
  const [months, setMonths] = useState(1);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => paySubscription(months),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      Alert.alert(
        'Subscription Activated',
        `Your ${months}-month subscription has been recorded. It will be activated once payment is verified.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: () => {
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    },
  });

  const total = SUBSCRIPTION_FEES.VENDOR * months;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Vendor Subscription</Text>
        <Text style={styles.subtitle}>Subscribe to access the full platform</Text>

        <Card style={styles.priceCard}>
          <Text style={styles.priceLabel}>Monthly Fee</Text>
          <Text style={styles.price}>{formatCurrency(SUBSCRIPTION_FEES.VENDOR)}</Text>
          <Text style={styles.priceNote}>/ month</Text>
        </Card>

        <Card style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What's included</Text>
          {SUBSCRIPTION_FEATURES.VENDOR.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✅</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.durationCard}>
          <Text style={styles.durationTitle}>Select Duration</Text>
          <View style={styles.durationOptions}>
            {[1, 3, 6, 12].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMonths(m)}
                style={[styles.durationBtn, months === m && styles.selectedDuration]}
              >
                <Text style={[styles.durationText, months === m && styles.selectedDurationText]}>
                  {m} {m === 1 ? 'month' : 'months'}
                </Text>
                {m >= 3 && (
                  <Text style={[styles.savingText, months === m && styles.selectedSavingText]}>
                    {m === 3 ? 'Save 5%' : m === 6 ? 'Save 10%' : 'Save 15%'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
          </View>
        </Card>

        <Button
          title={`Subscribe — ${formatCurrency(total)}`}
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          style={styles.subscribeBtn}
        />

        <Text style={styles.note}>
          Payment can be made via card, bank transfer, or mobile money. Your subscription will be activated once payment is verified.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.gray[500], marginBottom: 20 },
  priceCard: { alignItems: 'center', padding: 24, marginBottom: 16, backgroundColor: Colors.primary },
  priceLabel: { fontSize: 14, color: '#86efac', marginBottom: 4 },
  price: { fontSize: 40, fontWeight: '900', color: Colors.white },
  priceNote: { fontSize: 14, color: '#86efac' },
  featuresCard: { marginBottom: 16 },
  featuresTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureCheck: { fontSize: 16 },
  featureText: { fontSize: 14, color: Colors.gray[700], flex: 1 },
  durationCard: { marginBottom: 20 },
  durationTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 14 },
  durationOptions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  durationBtn: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  selectedDuration: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  durationText: { fontSize: 14, fontWeight: '600', color: Colors.gray[700] },
  selectedDurationText: { color: Colors.primary },
  savingText: { fontSize: 11, color: Colors.success, marginTop: 2 },
  selectedSavingText: { color: Colors.success },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: 15, color: Colors.gray[600] },
  totalAmount: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  subscribeBtn: { marginBottom: 16 },
  note: { fontSize: 12, color: Colors.gray[400], textAlign: 'center', lineHeight: 18 },
});
