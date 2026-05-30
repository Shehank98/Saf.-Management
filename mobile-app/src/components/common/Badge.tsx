import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#E3EFE9', text: '#1F4F3A' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  error: { bg: '#FEE2E2', text: '#991B1B' },
  info: { bg: '#DBEAFE', text: '#1E40AF' },
  neutral: { bg: Colors.gray[100], text: Colors.gray[600] },
};

export function Badge({ label, variant = 'neutral', icon }: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]} accessible accessibilityRole="text">
      {icon}
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
