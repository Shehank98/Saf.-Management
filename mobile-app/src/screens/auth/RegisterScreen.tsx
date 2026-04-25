import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { VENDOR_TYPES } from '../../utils/constants';
import { api } from '../../services/api.service';

interface Props { navigation: any; }

const ROLES = [
  { value: 'SAFARI_OWNER', label: 'Safari Owner', icon: '🏢', desc: 'Run safari tours' },
  { value: 'VENDOR',       label: 'Vendor',        icon: '🔧', desc: 'Provide services' },
];

export function RegisterScreen({ navigation }: Props) {
  const [step, setStep]           = useState(1);
  const [role, setRole]           = useState<'SAFARI_OWNER' | 'VENDOR'>('SAFARI_OWNER');
  const [vendorType, setVendorType] = useState('');
  const [loading, setLoading]     = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    companyName: '', companyAddress: '', businessName: '',
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const animateNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const goNext = () => {
    if (step === 1) {
      if (!role) return Alert.alert('Select Role', 'Please select an account type.');
    }
    if (step === 2 && role === 'VENDOR' && !vendorType) {
      return Alert.alert('Select Type', 'Please select your vendor type.');
    }
    if (step === 3) {
      if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
        return Alert.alert('Missing Info', 'Please fill all required fields.');
      }
      if (role === 'SAFARI_OWNER' && !form.companyName.trim()) {
        return Alert.alert('Missing Info', 'Please enter your company name.');
      }
      if (role === 'VENDOR' && !form.businessName.trim()) {
        return Alert.alert('Missing Info', 'Please enter your business name.');
      }
    }
    animateNext();
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 1) { navigation.goBack(); return; }
    animateNext();
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body: any = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role,
      };
      if (role === 'SAFARI_OWNER') {
        body.companyName    = form.companyName.trim();
        body.companyAddress = form.companyAddress.trim() || 'Sri Lanka';
      } else {
        body.vendorType   = vendorType;
        body.businessName = form.businessName.trim();
      }
      await api.post('/auth/register', body);
      Alert.alert(
        '✅ Registration Submitted',
        'Your account is under review by the Super Admin. You will be able to log in once approved.',
        [{ text: 'Back to Login', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = role === 'VENDOR' ? 4 : 3;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.stepText}>Step {step} of {totalSteps}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* Step 1 — Role selection */}
            {step === 1 && (
              <View>
                <Text style={styles.title}>Join as...</Text>
                <Text style={styles.subtitle}>Choose how you want to use the platform</Text>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setRole(r.value as any)}
                    activeOpacity={0.85}
                    style={[styles.roleCard, role === r.value && styles.roleCardSelected]}
                  >
                    <Text style={styles.roleIcon}>{r.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleLabel, role === r.value && styles.roleLabelSelected]}>{r.label}</Text>
                      <Text style={styles.roleDesc}>{r.desc}</Text>
                    </View>
                    {role === r.value && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Step 2 (VENDOR) — Vendor type */}
            {step === 2 && role === 'VENDOR' && (
              <View>
                <Text style={styles.title}>Vendor Type</Text>
                <Text style={styles.subtitle}>What service do you provide?</Text>
                <View style={styles.typeGrid}>
                  {VENDOR_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setVendorType(t.id)}
                      activeOpacity={0.85}
                      style={[styles.typeCard, vendorType === t.id && styles.typeCardSelected]}
                    >
                      <Text style={styles.typeIcon}>{t.icon}</Text>
                      <Text style={[styles.typeLabel, vendorType === t.id && { color: Colors.primary }]}>{t.title}</Text>
                      <Text style={styles.typeDesc}>{t.description}</Text>
                      {vendorType === t.id && <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>✓</Text></View>}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Details step */}
            {((step === 3 && role === 'VENDOR') || (step === 2 && role === 'SAFARI_OWNER') || (step === 3 && role === 'SAFARI_OWNER')) && (
              <View>
                {step === (role === 'VENDOR' ? 3 : 2) && (
                  <>
                    <Text style={styles.title}>Your Details</Text>
                    <Text style={styles.subtitle}>Tell us about yourself</Text>

                    <View style={styles.field}>
                      <Text style={styles.label}>Full Name *</Text>
                      <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="John Silva" placeholderTextColor={Colors.gray[400]} autoCapitalize="words" />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Email *</Text>
                      <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="you@example.com" placeholderTextColor={Colors.gray[400]} keyboardType="email-address" autoCapitalize="none" />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Phone *</Text>
                      <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+94771234567" placeholderTextColor={Colors.gray[400]} keyboardType="phone-pad" />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Password *</Text>
                      <TextInput style={styles.input} value={form.password} onChangeText={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="Minimum 8 characters" placeholderTextColor={Colors.gray[400]} secureTextEntry />
                    </View>

                    {role === 'SAFARI_OWNER' && (
                      <>
                        <View style={styles.field}>
                          <Text style={styles.label}>Company Name *</Text>
                          <TextInput style={styles.input} value={form.companyName} onChangeText={(v) => setForm((f) => ({ ...f, companyName: v }))} placeholder="Safari Adventures Ltd." placeholderTextColor={Colors.gray[400]} autoCapitalize="words" />
                        </View>
                        <View style={styles.field}>
                          <Text style={styles.label}>Company Address</Text>
                          <TextInput style={styles.input} value={form.companyAddress} onChangeText={(v) => setForm((f) => ({ ...f, companyAddress: v }))} placeholder="Colombo, Sri Lanka" placeholderTextColor={Colors.gray[400]} />
                        </View>
                      </>
                    )}

                    {role === 'VENDOR' && (
                      <View style={styles.field}>
                        <Text style={styles.label}>Business Name *</Text>
                        <TextInput style={styles.input} value={form.businessName} onChangeText={(v) => setForm((f) => ({ ...f, businessName: v }))} placeholder="Silva Jeep Services" placeholderTextColor={Colors.gray[400]} autoCapitalize="words" />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Review & Submit step */}
            {((step === 4 && role === 'VENDOR') || (step === 3 && role === 'SAFARI_OWNER')) && (
              <View>
                <Text style={styles.title}>Review & Submit</Text>
                <Text style={styles.subtitle}>Confirm your registration details</Text>

                <View style={styles.reviewCard}>
                  {[
                    { label: 'Role', value: role === 'SAFARI_OWNER' ? '🏢 Safari Owner' : '🔧 Vendor' },
                    ...(role === 'VENDOR' ? [{ label: 'Type', value: VENDOR_TYPES.find((t) => t.id === vendorType)?.title || vendorType }] : []),
                    { label: 'Name', value: form.name },
                    { label: 'Email', value: form.email },
                    { label: 'Phone', value: form.phone },
                    ...(role === 'SAFARI_OWNER' ? [{ label: 'Company', value: form.companyName }] : [{ label: 'Business', value: form.businessName }]),
                  ].map((row) => (
                    <View key={row.label} style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>{row.label}</Text>
                      <Text style={styles.reviewValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.notice}>
                  <Text style={styles.noticeText}>⏳ Your account will be reviewed by the Super Admin before you can log in.</Text>
                </View>

                <Button title={loading ? 'Submitting...' : 'Submit Registration'} onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
              </View>
            )}

          </Animated.View>
        </ScrollView>

        {/* Next button (all steps except last) */}
        {step < totalSteps && (
          <View style={styles.footer}>
            <Button title="Continue →" onPress={goNext} style={styles.nextBtn} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  progressBar:    { height: 4, backgroundColor: Colors.gray[200] },
  progressFill:   { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:        { padding: 8 },
  backArrow:      { fontSize: 20, color: Colors.gray[700] },
  stepText:       { fontSize: 13, color: Colors.gray[500], fontWeight: '600' },
  scroll:         { padding: 20, paddingBottom: 40 },
  title:          { fontSize: 26, fontWeight: '800', color: Colors.gray[900], marginBottom: 6 },
  subtitle:       { fontSize: 14, color: Colors.gray[500], marginBottom: 24 },
  roleCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: Colors.border, gap: 14 },
  roleCardSelected: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  roleIcon:       { fontSize: 32 },
  roleLabel:      { fontSize: 16, fontWeight: '700', color: Colors.gray[800] },
  roleLabelSelected: { color: Colors.primary },
  roleDesc:       { fontSize: 13, color: Colors.gray[400], marginTop: 2 },
  checkmark:      { fontSize: 18, color: Colors.primary, fontWeight: '800' },
  typeGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard:       { width: '47%', backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: Colors.border, position: 'relative' },
  typeCardSelected: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  typeIcon:       { fontSize: 28, marginBottom: 8 },
  typeLabel:      { fontSize: 13, fontWeight: '700', color: Colors.gray[800], marginBottom: 3 },
  typeDesc:       { fontSize: 11, color: Colors.gray[400] },
  typeBadge:      { position: 'absolute', top: 8, right: 8, width: 20, height: 20, backgroundColor: Colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeBadgeText:  { color: Colors.white, fontSize: 11, fontWeight: '700' },
  field:          { marginBottom: 16 },
  label:          { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input:          { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 15, color: Colors.gray[900], backgroundColor: Colors.white },
  reviewCard:     { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  reviewRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  reviewLabel:    { fontSize: 13, color: Colors.gray[500] },
  reviewValue:    { fontSize: 13, fontWeight: '600', color: Colors.gray[800], flex: 1, textAlign: 'right' },
  notice:         { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, marginBottom: 20 },
  noticeText:     { fontSize: 13, color: '#92400E', lineHeight: 20 },
  submitBtn:      { marginBottom: 8 },
  footer:         { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  nextBtn:        {},
});
