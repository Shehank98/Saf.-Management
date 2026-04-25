import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Animated, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { VENDOR_TYPES } from '../../utils/constants';
import { api } from '../../services/api.service';

interface Props { navigation: any; }

interface Location { id: string; name: string; description?: string; }

const ROLES = [
  { value: 'SAFARI_OWNER', label: 'Safari Owner', icon: '🏢', desc: 'Run safari tours' },
  { value: 'VENDOR',       label: 'Vendor',        icon: '🔧', desc: 'Provide services' },
];

// Step plan:
// VENDOR:       1=Role  2=VendorType  3=Details  4=Locations  5=Review
// SAFARI_OWNER: 1=Role  2=Details     3=Locations 4=Review

export function RegisterScreen({ navigation }: Props) {
  const [step, setStep]               = useState(1);
  const [role, setRole]               = useState<'SAFARI_OWNER' | 'VENDOR'>('SAFARI_OWNER');
  const [vendorType, setVendorType]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [locations, setLocations]     = useState<Location[]>([]);
  const [locLoading, setLocLoading]   = useState(false);
  const [selectedLocIds, setSelLocs]  = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    companyName: '', companyAddress: '', businessName: '', businessAddress: '',
    taxId: '', bankName: '', bankAccountNumber: '', bankAccountName: '', bankBranch: '',
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fetch locations once
  useEffect(() => {
    setLocLoading(true);
    api.get('/auth/locations')
      .then((r) => setLocations(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLocLoading(false));
  }, []);

  const animateNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const toggleLocation = (id: string) => {
    setSelLocs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const totalSteps = role === 'VENDOR' ? 5 : 4;

  // Helper: what logical "phase" is the current step?
  const isDetailsStep = () =>
    (role === 'VENDOR' && step === 3) || (role === 'SAFARI_OWNER' && step === 2);
  const isLocationsStep = () =>
    (role === 'VENDOR' && step === 4) || (role === 'SAFARI_OWNER' && step === 3);
  const isReviewStep = () =>
    (role === 'VENDOR' && step === 5) || (role === 'SAFARI_OWNER' && step === 4);

  const goNext = () => {
    if (step === 1 && !role) {
      return Alert.alert('Select Role', 'Please select an account type.');
    }
    if (step === 2 && role === 'VENDOR' && !vendorType) {
      return Alert.alert('Select Type', 'Please select your vendor type.');
    }
    if (isDetailsStep()) {
      if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
        return Alert.alert('Missing Info', 'Please fill all required fields.');
      }
      if (form.password.length < 8) {
        return Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      }
      if (role === 'SAFARI_OWNER' && !form.companyName.trim()) {
        return Alert.alert('Missing Info', 'Please enter your company name.');
      }
      if (role === 'VENDOR' && !form.businessName.trim()) {
        return Alert.alert('Missing Info', 'Please enter your business name.');
      }
    }
    if (isLocationsStep() && selectedLocIds.length === 0) {
      return Alert.alert('Select Location', 'Please select at least one location.');
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
        locationIds: selectedLocIds,
      };
      if (form.taxId.trim()) body.taxId = form.taxId.trim();
      if (role === 'SAFARI_OWNER') {
        body.companyName    = form.companyName.trim();
        body.companyAddress = form.companyAddress.trim() || 'Sri Lanka';
      } else {
        body.vendorType   = vendorType;
        body.businessName = form.businessName.trim();
        if (form.businessAddress.trim()) body.businessAddress = form.businessAddress.trim();
        if (form.bankName.trim()) {
          body.bankDetails = {
            bankName:      form.bankName.trim(),
            accountNumber: form.bankAccountNumber.trim(),
            accountName:   form.bankAccountName.trim(),
            branch:        form.bankBranch.trim(),
          };
        }
      }
      await api.post('/auth/register', body);
      Alert.alert(
        'Registration Submitted',
        'Your account is under review. You will be able to log in once the Super Admin approves your account.',
        [{ text: 'Back to Login', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [field]: v }));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` as any }]} />
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

            {/* ── Step 1: Role ── */}
            {step === 1 && (
              <View>
                <Text style={styles.title}>Join as...</Text>
                <Text style={styles.subtitle}>Choose how you want to use the platform</Text>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value} onPress={() => setRole(r.value as any)} activeOpacity={0.85}
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

            {/* ── Step 2 (VENDOR): Vendor type ── */}
            {step === 2 && role === 'VENDOR' && (
              <View>
                <Text style={styles.title}>Vendor Type</Text>
                <Text style={styles.subtitle}>What service do you provide?</Text>
                <View style={styles.typeGrid}>
                  {VENDOR_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.id} onPress={() => setVendorType(t.id)} activeOpacity={0.85}
                      style={[styles.typeCard, vendorType === t.id && styles.typeCardSelected]}
                    >
                      <Text style={styles.typeIcon}>{t.icon}</Text>
                      <Text style={[styles.typeLabel, vendorType === t.id && { color: Colors.primary }]}>{t.title}</Text>
                      <Text style={styles.typeDesc}>{t.description}</Text>
                      {vendorType === t.id && (
                        <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>✓</Text></View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── Details step ── */}
            {isDetailsStep() && (
              <View>
                <Text style={styles.title}>Your Details</Text>
                <Text style={styles.subtitle}>Tell us about yourself</Text>

                <Field label="Full Name *">
                  <TextInput style={styles.input} value={form.name} onChangeText={set('name')} placeholder="John Silva" placeholderTextColor={Colors.gray[400]} autoCapitalize="words" />
                </Field>
                <Field label="Email *">
                  <TextInput style={styles.input} value={form.email} onChangeText={set('email')} placeholder="you@example.com" placeholderTextColor={Colors.gray[400]} keyboardType="email-address" autoCapitalize="none" />
                </Field>
                <Field label="Phone *">
                  <TextInput style={styles.input} value={form.phone} onChangeText={set('phone')} placeholder="+94771234567" placeholderTextColor={Colors.gray[400]} keyboardType="phone-pad" />
                </Field>
                <Field label="Password *">
                  <TextInput style={styles.input} value={form.password} onChangeText={set('password')} placeholder="Minimum 8 characters" placeholderTextColor={Colors.gray[400]} secureTextEntry />
                </Field>

                {role === 'SAFARI_OWNER' && (
                  <>
                    <Field label="Company Name *">
                      <TextInput style={styles.input} value={form.companyName} onChangeText={set('companyName')} placeholder="Safari Adventures Ltd." placeholderTextColor={Colors.gray[400]} autoCapitalize="words" />
                    </Field>
                    <Field label="Company Address">
                      <TextInput style={styles.input} value={form.companyAddress} onChangeText={set('companyAddress')} placeholder="Colombo, Sri Lanka" placeholderTextColor={Colors.gray[400]} />
                    </Field>
                  </>
                )}

                {role === 'VENDOR' && (
                  <>
                    <Field label="Business Name *">
                      <TextInput style={styles.input} value={form.businessName} onChangeText={set('businessName')} placeholder="Silva Jeep Services" placeholderTextColor={Colors.gray[400]} autoCapitalize="words" />
                    </Field>
                    <Field label="Business Address (optional)">
                      <TextInput style={styles.input} value={form.businessAddress} onChangeText={set('businessAddress')} placeholder="No. 1, Safari Road, Yala" placeholderTextColor={Colors.gray[400]} />
                    </Field>
                  </>
                )}

                <Field label="Tax ID / VAT Number (optional)">
                  <TextInput style={styles.input} value={form.taxId} onChangeText={set('taxId')} placeholder="VAT123456789" placeholderTextColor={Colors.gray[400]} autoCapitalize="characters" />
                </Field>

                {role === 'VENDOR' && (
                  <View style={styles.bankBox}>
                    <Text style={styles.bankTitle}>Bank Details (optional)</Text>
                    <Field label="Bank Name">
                      <TextInput style={styles.input} value={form.bankName} onChangeText={set('bankName')} placeholder="Bank of Ceylon" placeholderTextColor={Colors.gray[400]} />
                    </Field>
                    <Field label="Account Number">
                      <TextInput style={styles.input} value={form.bankAccountNumber} onChangeText={set('bankAccountNumber')} placeholder="0123456789" placeholderTextColor={Colors.gray[400]} keyboardType="numeric" />
                    </Field>
                    <Field label="Account Name">
                      <TextInput style={styles.input} value={form.bankAccountName} onChangeText={set('bankAccountName')} placeholder="John Silva" placeholderTextColor={Colors.gray[400]} />
                    </Field>
                    <Field label="Branch">
                      <TextInput style={styles.input} value={form.bankBranch} onChangeText={set('bankBranch')} placeholder="Colombo 03" placeholderTextColor={Colors.gray[400]} />
                    </Field>
                  </View>
                )}
              </View>
            )}

            {/* ── Locations step ── */}
            {isLocationsStep() && (
              <View>
                <Text style={styles.title}>
                  {role === 'SAFARI_OWNER' ? 'Operating Locations' : 'Service Locations'}
                </Text>
                <Text style={styles.subtitle}>
                  {role === 'SAFARI_OWNER'
                    ? 'Select all safari parks where you operate tours'
                    : 'Select all locations where you provide your services'}
                </Text>

                {locLoading ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
                ) : locations.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No locations available. Contact admin.</Text>
                  </View>
                ) : (
                  <View style={styles.locGrid}>
                    {locations.map((loc) => {
                      const selected = selectedLocIds.includes(loc.id);
                      return (
                        <TouchableOpacity
                          key={loc.id} onPress={() => toggleLocation(loc.id)} activeOpacity={0.85}
                          style={[styles.locCard, selected && styles.locCardSelected]}
                        >
                          <Text style={styles.locIcon}>📍</Text>
                          <Text style={[styles.locName, selected && { color: Colors.primary }]}>{loc.name}</Text>
                          {selected && (
                            <View style={styles.locCheck}><Text style={styles.locCheckText}>✓</Text></View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {selectedLocIds.length > 0 && (
                  <View style={styles.selectionBadge}>
                    <Text style={styles.selectionText}>{selectedLocIds.length} location(s) selected</Text>
                  </View>
                )}
              </View>
            )}

            {/* ── Review & Submit ── */}
            {isReviewStep() && (
              <View>
                <Text style={styles.title}>Review & Submit</Text>
                <Text style={styles.subtitle}>Confirm your registration details</Text>

                <View style={styles.reviewCard}>
                  {[
                    { label: 'Role',      value: role === 'SAFARI_OWNER' ? '🏢 Safari Owner' : '🔧 Vendor' },
                    ...(role === 'VENDOR' ? [{ label: 'Type', value: VENDOR_TYPES.find((t) => t.id === vendorType)?.title || vendorType }] : []),
                    { label: 'Name',      value: form.name },
                    { label: 'Email',     value: form.email },
                    { label: 'Phone',     value: form.phone },
                    ...(role === 'SAFARI_OWNER'
                      ? [{ label: 'Company', value: form.companyName }]
                      : [{ label: 'Business', value: form.businessName }]
                    ),
                    { label: 'Locations', value: `${selectedLocIds.length} selected` },
                  ].map((row) => (
                    <View key={row.label} style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>{row.label}</Text>
                      <Text style={styles.reviewValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.notice}>
                  <Text style={styles.noticeText}>
                    ⏳ Your account will be reviewed by the Super Admin before you can log in.
                  </Text>
                </View>

                <Button
                  title={loading ? 'Submitting...' : 'Submit Registration'}
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </View>
            )}

          </Animated.View>
        </ScrollView>

        {/* Continue button (all steps except last) */}
        {!isReviewStep() && (
          <View style={styles.footer}>
            <Button title="Continue →" onPress={goNext} style={styles.nextBtn} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.background },
  progressBar:       { height: 4, backgroundColor: Colors.gray[200] },
  progressFill:      { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:           { padding: 8 },
  backArrow:         { fontSize: 20, color: Colors.gray[700] },
  stepText:          { fontSize: 13, color: Colors.gray[500], fontWeight: '600' },
  scroll:            { padding: 20, paddingBottom: 40 },
  title:             { fontSize: 26, fontWeight: '800', color: Colors.gray[900], marginBottom: 6 },
  subtitle:          { fontSize: 14, color: Colors.gray[500], marginBottom: 24 },
  roleCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: Colors.border, gap: 14 },
  roleCardSelected:  { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  roleIcon:          { fontSize: 32 },
  roleLabel:         { fontSize: 16, fontWeight: '700', color: Colors.gray[800] },
  roleLabelSelected: { color: Colors.primary },
  roleDesc:          { fontSize: 13, color: Colors.gray[400], marginTop: 2 },
  checkmark:         { fontSize: 18, color: Colors.primary, fontWeight: '800' },
  typeGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard:          { width: '47%', backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: Colors.border, position: 'relative' },
  typeCardSelected:  { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  typeIcon:          { fontSize: 28, marginBottom: 8 },
  typeLabel:         { fontSize: 13, fontWeight: '700', color: Colors.gray[800], marginBottom: 3 },
  typeDesc:          { fontSize: 11, color: Colors.gray[400] },
  typeBadge:         { position: 'absolute', top: 8, right: 8, width: 20, height: 20, backgroundColor: Colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeBadgeText:     { color: Colors.white, fontSize: 11, fontWeight: '700' },
  field:             { marginBottom: 16 },
  label:             { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input:             { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 15, color: Colors.gray[900], backgroundColor: Colors.white },
  bankBox:           { backgroundColor: Colors.gray[50], borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  bankTitle:         { fontSize: 14, fontWeight: '700', color: Colors.gray[700], marginBottom: 12 },
  locGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  locCard:           { width: '47%', backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', position: 'relative' },
  locCardSelected:   { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  locIcon:           { fontSize: 24, marginBottom: 6 },
  locName:           { fontSize: 13, fontWeight: '600', color: Colors.gray[800], textAlign: 'center' },
  locCheck:          { position: 'absolute', top: 8, right: 8, width: 20, height: 20, backgroundColor: Colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locCheckText:      { color: Colors.white, fontSize: 11, fontWeight: '700' },
  selectionBadge:    { marginTop: 14, backgroundColor: '#dcfce7', borderRadius: 10, padding: 10, alignItems: 'center' },
  selectionText:     { color: '#166534', fontSize: 13, fontWeight: '600' },
  emptyBox:          { backgroundColor: Colors.gray[100], borderRadius: 14, padding: 24, alignItems: 'center' },
  emptyText:         { color: Colors.gray[400], fontSize: 14 },
  reviewCard:        { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  reviewRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  reviewLabel:       { fontSize: 13, color: Colors.gray[500] },
  reviewValue:       { fontSize: 13, fontWeight: '600', color: Colors.gray[800], flex: 1, textAlign: 'right' },
  notice:            { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, marginBottom: 20 },
  noticeText:        { fontSize: 13, color: '#92400E', lineHeight: 20 },
  submitBtn:         { marginBottom: 8 },
  footer:            { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  nextBtn:           {},
});
