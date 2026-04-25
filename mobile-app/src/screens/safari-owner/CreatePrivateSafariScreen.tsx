import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api.service';
import { Button } from '../../components/common/Button';
import { Colors } from '../../theme/colors';
import { SAFARI_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

interface Props { navigation: any; }

export function CreatePrivateSafariScreen({ navigation }: Props) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    numberOfGuests: '',
    safariDate: '',
    safariType: 'Full Day',
    totalAmount: '',
    specialRequests: '',
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        safariDate:     form.safariDate,
        safariType:     form.safariType,
        numberOfGuests: parseInt(form.numberOfGuests),
        totalAmount:    parseFloat(form.totalAmount),
        customerName:   form.customerName.trim(),
        customerPhone:  form.customerPhone.trim(),
        customerEmail:  form.customerEmail.trim(),
        specialRequests: form.specialRequests.trim() || undefined,
      };
      const res = await api.post('/private-safari/inquiry', body);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private-safaris'] });
      Alert.alert(
        '✅ Safari Created',
        'The private safari has been created. Send the deposit payment link to the customer.',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to create safari.');
    },
  });

  const deposit = form.totalAmount ? parseFloat(form.totalAmount) * 0.3 : 0;
  const isValid = form.safariDate.match(/^\d{4}-\d{2}-\d{2}$/)
    && parseInt(form.numberOfGuests) > 0
    && parseFloat(form.totalAmount) > 0
    && form.customerName.trim();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>New Private Safari</Text>
          <Text style={styles.subtitle}>Enter the booking details for your customer</Text>

          {/* Customer info */}
          <Text style={styles.section}>Customer Information</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput style={styles.input} value={form.customerName} onChangeText={(v) => set('customerName', v)} placeholder="John Silva" placeholderTextColor={Colors.gray[400]} autoCapitalize="words" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={form.customerPhone} onChangeText={(v) => set('customerPhone', v)} placeholder="+94771234567" placeholderTextColor={Colors.gray[400]} keyboardType="phone-pad" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={form.customerEmail} onChangeText={(v) => set('customerEmail', v)} placeholder="customer@email.com" placeholderTextColor={Colors.gray[400]} keyboardType="email-address" autoCapitalize="none" />
          </View>

          {/* Safari details */}
          <Text style={styles.section}>Safari Details</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Safari Date * (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={form.safariDate} onChangeText={(v) => set('safariDate', v)} placeholder="2026-03-15" placeholderTextColor={Colors.gray[400]} keyboardType="numbers-and-punctuation" />
            {form.safariDate && !form.safariDate.match(/^\d{4}-\d{2}-\d{2}$/) && (
              <Text style={styles.error}>Use format: YYYY-MM-DD</Text>
            )}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Safari Type *</Text>
            <View style={styles.typeRow}>
              {SAFARI_TYPES.map((t) => (
                <TouchableOpacity key={t} onPress={() => set('safariType', t)} style={[styles.typeBtn, form.safariType === t && styles.typeBtnActive]}>
                  <Text style={[styles.typeBtnText, form.safariType === t && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Number of Guests *</Text>
            <TextInput style={styles.input} value={form.numberOfGuests} onChangeText={(v) => set('numberOfGuests', v)} placeholder="4" placeholderTextColor={Colors.gray[400]} keyboardType="number-pad" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Total Package Price (LKR) *</Text>
            <TextInput style={styles.input} value={form.totalAmount} onChangeText={(v) => set('totalAmount', v)} placeholder="50000" placeholderTextColor={Colors.gray[400]} keyboardType="numeric" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Special Requests</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.specialRequests} onChangeText={(v) => set('specialRequests', v)} placeholder="Wheelchair access, vegetarian meals..." placeholderTextColor={Colors.gray[400]} multiline />
          </View>

          {/* Financial summary */}
          {isValid && (
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>💰 Financial Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Package</Text>
                <Text style={styles.summaryValue}>{formatCurrency(parseFloat(form.totalAmount))}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>30% Deposit Required</Text>
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>{formatCurrency(deposit)}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>Remaining on Day</Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>{formatCurrency(parseFloat(form.totalAmount) - deposit)}</Text>
              </View>
            </View>
          )}

          <Button
            title={mutation.isPending ? 'Creating...' : 'Create Booking'}
            onPress={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            loading={mutation.isPending}
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  scroll:           { padding: 20, paddingBottom: 40 },
  title:            { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 4 },
  subtitle:         { fontSize: 14, color: Colors.gray[500], marginBottom: 24 },
  section:          { fontSize: 15, fontWeight: '700', color: Colors.gray[700], marginBottom: 12, marginTop: 8 },
  field:            { marginBottom: 16 },
  label:            { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input:            { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 15, color: Colors.gray[900], backgroundColor: Colors.white },
  error:            { color: Colors.error, fontSize: 12, marginTop: 4 },
  typeRow:          { flexDirection: 'row', gap: 8 },
  typeBtn:          { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.white },
  typeBtnActive:    { borderColor: Colors.secondary, backgroundColor: '#FEF3C7' },
  typeBtnText:      { fontSize: 11, fontWeight: '600', color: Colors.gray[600] },
  typeBtnTextActive: { color: Colors.secondary },
  summary:          { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  summaryTitle:     { fontSize: 14, fontWeight: '700', color: Colors.gray[900], marginBottom: 12 },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  summaryLabel:     { fontSize: 13, color: Colors.gray[500] },
  summaryValue:     { fontSize: 13, fontWeight: '700', color: Colors.gray[800] },
  btn:              { marginBottom: 8 },
});
