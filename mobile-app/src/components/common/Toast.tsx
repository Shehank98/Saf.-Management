import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; text: string; emoji: string }> = {
  success: { bg: '#E3EFE9', text: '#1F4F3A', emoji: '✔' },
  error: { bg: '#FEE2E2', text: '#991B1B', emoji: '✖' },
  warning: { bg: '#FEF3C7', text: '#92400E', emoji: '⚠' },
  info: { bg: '#DBEAFE', text: '#1E40AF', emoji: 'ℹ' },
};

export function Toast({ visible, message, variant = 'info', duration = 3500, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 100, duration: 200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss, translateY, opacity]);

  if (!visible) return null;

  const { bg, text, emoji } = VARIANT_STYLES[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bg, transform: [{ translateY }], opacity },
      ]}
      accessibilityRole="alert"
    >
      <Text style={[styles.emoji, { color: text }]}>{emoji}</Text>
      <Text style={[styles.message, { color: text }]} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={[styles.dismiss, { color: text }]}>Dismiss</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emoji: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  dismiss: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.7,
  },
});
