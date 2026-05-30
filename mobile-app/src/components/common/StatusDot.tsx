import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type StatusDotVariant = 'active' | 'warning' | 'error' | 'inactive';

interface StatusDotProps {
  variant: StatusDotVariant;
  label?: string;
  pulse?: boolean;
}

const VARIANT_COLORS: Record<StatusDotVariant, { dot: string; ring: string }> = {
  active: { dot: '#2D6A4F', ring: 'rgba(45,106,79,0.2)' },
  warning: { dot: '#D97706', ring: 'rgba(217,119,6,0.2)' },
  error: { dot: '#DC2626', ring: 'rgba(220,38,38,0.2)' },
  inactive: { dot: '#D1D5DB', ring: 'transparent' },
};

export function StatusDot({ variant, label, pulse }: StatusDotProps) {
  const { dot, ring } = VARIANT_COLORS[variant];

  return (
    <View style={styles.container} accessible accessibilityLabel={`Status: ${label || variant}`}>
      <View style={[styles.ring, { backgroundColor: ring }]}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ring: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555555',
  },
});
