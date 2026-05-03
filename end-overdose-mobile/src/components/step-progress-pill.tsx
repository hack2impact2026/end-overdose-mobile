import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type StepProgressPillProps = {
  currentStep: number;
  labels?: string[];
};

export function StepProgressPill({
  currentStep,
  labels = ['Step 1', 'Step 2', 'Step 3'],
}: StepProgressPillProps) {
  return (
    <View style={styles.pill} accessibilityRole="progressbar">
      {labels.map((label, index) => {
        const isActive = index + 1 === currentStep;

        return (
          <View
            key={index}
            style={[styles.segment, isActive ? styles.activeSegment : styles.inactiveSegment]}
          >
            <View
              style={[
                styles.indicator,
                isActive ? styles.activeIndicator : styles.inactiveIndicator,
              ]}
            />
            <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: '#F1DEDE',
    shadowColor: '#D8B9B9',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  activeSegment: {
    backgroundColor: '#E60023',
  },
  inactiveSegment: {
    backgroundColor: '#F6F0F0',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
  inactiveIndicator: {
    backgroundColor: '#D69DA5',
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
  inactiveLabel: {
    color: '#8C5C64',
  },
});
