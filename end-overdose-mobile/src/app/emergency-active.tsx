import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HoldToCancelButton } from '@/components/hold-to-cancel-button';

function ActionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={styles.actionButton}
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
        <Text style={styles.actionButtonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function EmergencyActiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <HoldToCancelButton
          label="Hold to cancel"
          onComplete={() => router.navigate('/emergency')}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.ambulanceBadgeOuter}>
          <View style={styles.ambulanceBadgeInner}>
            <MaterialCommunityIcons name="ambulance" size={96} color="#E60023" />
          </View>
        </View>

        <Text style={styles.headline}>
          Take a deep breath{'\n'}Help is on the way
        </Text>

        <View style={styles.buttons}>
          <ActionButton
            label="I NEED HELP"
            onPress={() => router.navigate('/emergency-911')}
          />
          <ActionButton
            label="I'M READY TO HELP"
            onPress={() => router.navigate('/triage')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E60023',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  ambulanceBadgeOuter: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 6,
    borderColor: '#E60023',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  ambulanceBadgeInner: {
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: 36,
    marginBottom: 40,
  },
  buttons: {
    width: '100%',
    gap: 14,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#E60023',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
});
