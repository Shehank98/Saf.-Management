import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionWrap}>
          <Button title={actionLabel} onPress={onAction} size="md" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.gray[800],
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 4,
  },
  actionWrap: {
    marginTop: 20,
  },
});
