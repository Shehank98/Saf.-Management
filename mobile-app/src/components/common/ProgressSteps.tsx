import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface Step {
  label: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <View style={styles.container} accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${currentStep + 1} of ${steps.length}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.label}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmark}>{'✓'}</Text>
                ) : (
                  <Text style={[styles.number, (isCompleted || isCurrent) && styles.numberActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.label, (isCompleted || isCurrent) && styles.labelActive]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View style={[styles.connector, isCompleted && styles.connectorCompleted]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: Colors.primary,
  },
  circleCurrent: {
    backgroundColor: '#E3EFE9',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.gray[200],
    marginHorizontal: 4,
    borderRadius: 1,
  },
  connectorCompleted: {
    backgroundColor: Colors.primary,
  },
  number: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[400],
  },
  numberActive: {
    color: Colors.primary,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gray[400],
    textAlign: 'center',
    maxWidth: 60,
  },
  labelActive: {
    color: Colors.gray[800],
  },
});
