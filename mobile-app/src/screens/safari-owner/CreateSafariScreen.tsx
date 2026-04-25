import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSharedJeep } from '../../services/owner.service';
import { Button } from '../../components/common/Button';
import { Colors } from '../../theme/colors';
import { SAFARI_TYPES } from '../../utils/constants';

interface Props {
  navigation: any;
}

export function CreateSafariScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [safariDate, setSafariDate] = useState('');
  const [safariType, setSafariType] = useState('Full Day');
  const [pricePerSeat, setPricePerSeat] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createSharedJeep({
        safariDate,
        safariType,
        pricePerSeat: parseFloat(pricePerSeat),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-jeeps'] });
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] });
      Alert.alert('Safari Created!', 'The shared safari is now open for bookings.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create safari. Please check your inputs.');
    },
  });

  const isValid = safariDate.match(/^\d{4}-\d{2}-\d{2}$/) && parseFloat(pricePerSeat) > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Shared Safari</Text>
        <Text style={styles.subtitle}>Set up a new shared jeep safari open for bookings</Text>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Safari Date</Text>
          <TextInput
            style={styles.input}
            value={safariDate}
            onChangeText={setSafariDate}
            placeholder="YYYY-MM-DD  e.g. 2025-06-15"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="numbers-and-punctuation"
          />
          {safariDate && !safariDate.match(/^\d{4}-\d{2}-\d{2}$/) && (
            <Text style={styles.errorText}>Use format: YYYY-MM-DD</Text>
          )}
        </View>

        {/* Safari Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Safari Type</Text>
          <View style={styles.typeRow}>
            {SAFARI_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSafariType(type)}
                style={[styles.typeBtn, safariType === type && styles.selectedType]}
              >
                <Text style={[styles.typeText, safariType === type && styles.selectedTypeText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View style={styles.field}>
          <Text style={styles.label}>Price per Seat (LKR)</Text>
          <TextInput
            style={styles.input}
            value={pricePerSeat}
            onChangeText={setPricePerSeat}
            placeholder="e.g. 4500"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="numeric"
          />
        </View>

        {/* Summary */}
        {isValid && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{safariDate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type</Text>
              <Text style={styles.summaryValue}>{safariType}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price/Seat</Text>
              <Text style={styles.summaryValue}>LKR {parseFloat(pricePerSeat).toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Max Revenue (6 seats)</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: '800' }]}>
                LKR {(parseFloat(pricePerSeat) * 6).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Confirms when</Text>
              <Text style={styles.summaryValue}>4+ seats paid</Text>
            </View>
          </View>
        )}

        <Button
          title={mutation.isPending ? 'Creating...' : 'Create Safari'}
          onPress={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
          loading={mutation.isPending}
          style={styles.createBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.gray[500], marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: Colors.gray[900],
    backgroundColor: Colors.white,
  },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  selectedType: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  typeText: { fontSize: 12, fontWeight: '600', color: Colors.gray[600] },
  selectedTypeText: { color: Colors.primary },
  summary: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray[900], marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  summaryLabel: { fontSize: 13, color: Colors.gray[500] },
  summaryValue: { fontSize: 13, fontWeight: '600', color: Colors.gray[800] },
  createBtn: { marginBottom: 32 },
});
