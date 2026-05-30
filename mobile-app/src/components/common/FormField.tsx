import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

export function FormField({ label, error, required, hint, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          props.editable === false && styles.inputDisabled,
          style,
        ]}
        placeholderTextColor={Colors.gray[400]}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...props}
      />
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[600],
    marginBottom: 6,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.gray[50],
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.gray[800],
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.gray[100],
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginTop: 6,
  },
  hintText: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 4,
  },
});
