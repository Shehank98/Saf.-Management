import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
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
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      const user = await login(email.trim(), password);
      setUser(user);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.error
        : 'Login failed';
      Alert.alert('Login Failed', msg || 'Please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

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
                Don't have an account? <Text style={styles.registerLinkText}>Register</Text>
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
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.gray[900],
    backgroundColor: Colors.gray[50],
  },
  loginBtn: { marginTop: 8 },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { color: Colors.gray[500], fontSize: 14 },
  registerLinkText: { color: Colors.primary, fontWeight: '700' },
});
