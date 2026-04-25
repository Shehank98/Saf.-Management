import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';

interface SafariLoaderProps {
  text?: string;
}

export function SafariLoader({ text = 'Loading your safari...' }: SafariLoaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🦁</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  emoji: { fontSize: 64, marginBottom: 16 },
  spinner: { marginBottom: 16 },
  text: { color: Colors.gray[500], fontSize: 15 },
});
