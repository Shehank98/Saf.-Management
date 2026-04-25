import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/common/Button';
import { Colors } from '../../theme/colors';

interface LoginScreenProps {
  navigation: any;
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setIsLoading(true);
    setIsPending(false);
    try {
      const user = await login(email.trim(), password);
      setUser(user);
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.status : null;
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.error : 'Login failed';

      if (status === 403 && msg?.toLowerCase().includes('pending')) {
        setIsPending(true);
      } else if (status === 403 && msg?.toLowerCase().includes('rejected')) {
        Alert.alert('Account Rejected', 'Your account has been rejected. Please contact support.');
      } else {
        Alert.alert('Login Failed', msg || 'Please check your credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pendingContainer}>
          <Text style={styles.pendingEmoji}>⏳</Text>
          <Text style={styles.pendingTitle}>Account Pending Approval</Text>
          <Text style={styles.pendingText}>
            Your account is under review by the Super Admin.{'\n'}
            You will be able to log in once approved.
          </Text>
          <TouchableOpacity onPress={() => setIsPending(false)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.emoji}>🌿</Text>
            <Text style={styles.title}>Safari Adventures</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.gray[400]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.gray[400]}
                secureTextEntry
              />
            </View>

            <Button title="Sign In" onPress={handleLogin} loading={isLoading} style={styles.loginBtn} />

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
              <Text style={styles.registerText}>
                Don&apos;t have an account?{' '}
                <Text style={styles.registerLinkText}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryDark },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#86efac', textAlign: 'center' },
  form: {
    backgroundColor: Colors.white, borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: Colors.gray[900], backgroundColor: Colors.gray[50],
  },
  loginBtn: { marginTop: 8 },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { color: Colors.gray[500], fontSize: 14 },
  registerLinkText: { color: Colors.primary, fontWeight: '700' },
  // Pending state
  pendingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pendingEmoji: { fontSize: 64, marginBottom: 16 },
  pendingTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 12, textAlign: 'center' },
  pendingText: { fontSize: 15, color: '#86efac', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  backBtn: { backgroundColor: Colors.white, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  backBtnText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 15 },
});
