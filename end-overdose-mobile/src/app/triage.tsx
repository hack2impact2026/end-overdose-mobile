import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GuidedFlowBackButton } from '@/components/guided-flow-back-button';
import { MoreGuidancePanel } from '@/components/more-guidance-panel';
import { StepProgressPill } from '@/components/step-progress-pill';

type EmergencyStep =
  | 'call-help'
  | 'give-naloxone'
  | 'check-breathing'
  | 'support-breathing'
  | 'recovery-position';

type ActionConfig = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

type StepConfig = {
  title: string;
  instruction: string;
  progressStep: number;
  actions: ActionConfig[];
  guidance: string[];
};

function ActionButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.actionButton, variant === 'secondary' && styles.secondaryActionButton]}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.96, { duration: 80 });
          opacity.value = withTiming(0.85, { duration: 80 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
          opacity.value = withTiming(1, { duration: 150 });
        }}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.actionButtonText,
            variant === 'secondary' && styles.secondaryActionButtonText,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function EmergencyGuidedFlow({
  initialStep = 'call-help',
}: {
  initialStep?: EmergencyStep;
}) {
  const router = useRouter();
  const [step, setStep] = useState<EmergencyStep>(initialStep);
  const [history, setHistory] = useState<EmergencyStep[]>([]);

  function goTo(nextStep: EmergencyStep) {
    setHistory((currentHistory) => [...currentHistory, step]);
    setStep(nextStep);
  }

  function handleBack() {
    if (history.length === 0) {
      router.navigate('/emergency-active');
      return;
    }

    const previousStep = history[history.length - 1];
    setHistory((currentHistory) => currentHistory.slice(0, -1));
    setStep(previousStep);
  }

  async function handleCall911() {
    try {
      await Linking.openURL('tel:911');
    } catch {
      // Some simulators cannot place calls. Keep the user on the same step.
    }
  }

  const stepConfig: Record<EmergencyStep, StepConfig> = {
    'call-help': {
      title: 'Call help',
      instruction: 'Call 911 now.',
      progressStep: 1,
      actions: [
        { label: 'Call 911', onPress: handleCall911 },
        { label: 'I already called', onPress: () => goTo('give-naloxone'), variant: 'secondary' },
      ],
      guidance: [
        'Stay with the person.',
        'Put the phone on speaker.',
        'Share your exact location.',
      ],
    },
    'give-naloxone': {
      title: 'Give naloxone',
      instruction: 'Spray into one nostril.',
      progressStep: 2,
      actions: [
        { label: 'Naloxone given', onPress: () => goTo('check-breathing') },
        { label: 'No naloxone', onPress: () => goTo('check-breathing'), variant: 'secondary' },
      ],
      guidance: [
        'Lay them on their back.',
        'Insert the tip and press once.',
        'If needed, give a second dose after 2 to 3 minutes.',
        'If you are unsure, give it anyway.',
      ],
    },
    'check-breathing': {
      title: 'Check breathing',
      instruction: 'Are they breathing normally?',
      progressStep: 3,
      actions: [
        { label: 'Yes', onPress: () => goTo('recovery-position') },
        { label: 'No / unsure', onPress: () => goTo('support-breathing'), variant: 'secondary' },
      ],
      guidance: [
        'Look for chest movement.',
        'Listen for breaths.',
        'If breathing is weak or unsure, support breathing.',
        'If they are breathing, place them on their side.',
      ],
    },
    'support-breathing': {
      title: 'Support breathing',
      instruction: 'Keep airway open.',
      progressStep: 3,
      actions: [
        { label: 'Breathing now', onPress: () => goTo('recovery-position') },
        { label: 'EMS arrived', onPress: () => router.navigate('/emergency'), variant: 'secondary' },
      ],
      guidance: [
        'Tilt the head back and lift the chin.',
        'If trained and able, give rescue breaths.',
        'Watch for the chest to rise.',
        'Give more naloxone after 2 to 3 minutes if needed.',
      ],
    },
    'recovery-position': {
      title: 'On their side',
      instruction: 'Stay until help arrives.',
      progressStep: 3,
      actions: [{ label: 'EMS arrived', onPress: () => router.navigate('/emergency') }],
      guidance: [
        'Keep them on their side.',
        'This helps prevent choking.',
        'Keep them warm.',
        'Give more naloxone after 2 to 3 minutes if needed.',
      ],
    },
  };

  const currentStep = stepConfig[step];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GuidedFlowBackButton
          onPress={handleBack}
          onHoldComplete={() => router.navigate('/emergency')}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.instruction}>{currentStep.instruction}</Text>
        </View>

        <View style={styles.actions}>
          {currentStep.actions.map((action) => (
            <ActionButton
              key={action.label}
              label={action.label}
              onPress={action.onPress}
              variant={action.variant}
            />
          ))}
        </View>

        <MoreGuidancePanel items={currentStep.guidance} />
      </ScrollView>

      <View style={styles.footer}>
        <StepProgressPill
          currentStep={currentStep.progressStep}
          labels={['Call', 'Naloxone', 'Breathing']}
        />
      </View>
    </SafeAreaView>
  );
}

export default function TriageScreen() {
  return <EmergencyGuidedFlow />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFDFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 28,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    fontFamily: 'System',
  },
  instruction: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#C61B31',
    textAlign: 'center',
    fontFamily: 'System',
    maxWidth: 280,
  },
  actions: {
    width: '100%',
    gap: 14,
  },
  actionButton: {
    minHeight: 72,
    borderRadius: 26,
    backgroundColor: '#E60023',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  secondaryActionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E60023',
  },
  actionButtonText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
  },
  secondaryActionButtonText: {
    color: '#B20F26',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 14,
    alignItems: 'center',
  },
});
