import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReanimatedAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Emergency } from '@/constants/theme';

const BUTTON_SIZE = 160;
const RING1_SIZE = 220;
const RING2_SIZE = 300;
const DOUBLE_TAP_DELAY = 400;

interface SOSButtonProps {
  onConfirmed: () => void;
  onArmedChange?: (armed: boolean) => void;
}

export function SOSEmergencyButton({ onConfirmed, onArmedChange }: SOSButtonProps) {
  const [armed, setArmed] = useState(false);
  const lastTapRef = useRef(0);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setArmedState(value: boolean) {
    setArmed(value);
    onArmedChange?.(value);
  }

  // Ring animations (react-native Animated — simple and reliable for looping)
  const ring1Anim = useRef(new Animated.Value(1)).current;
  const ring2Anim = useRef(new Animated.Value(1)).current;

  // Pressable feedback (Reanimated for spring)
  const pressScale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  const pressAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    opacity: pressOpacity.value,
  }));

  useEffect(() => {
    const duration = armed ? 700 : 1400;

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(ring1Anim, {
          toValue: 1.06,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring1Anim, {
          toValue: 1.0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(ring2Anim, {
          toValue: 1.06,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring2Anim, {
          toValue: 1.0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    const offset = setTimeout(() => loop2.start(), armed ? 200 : 500);

    return () => {
      loop1.stop();
      loop2.stop();
      clearTimeout(offset);
    };
  }, [armed, ring1Anim, ring2Anim]);

  function handlePress() {
    const now = Date.now();
    const timeSinceLast = now - lastTapRef.current;

    if (armed && timeSinceLast < DOUBLE_TAP_DELAY) {
      if (disarmTimer.current) clearTimeout(disarmTimer.current);
      setArmedState(false);
      lastTapRef.current = 0;
      onConfirmed();
      return;
    }

    setArmedState(true);
    lastTapRef.current = now;

    if (disarmTimer.current) clearTimeout(disarmTimer.current);
    disarmTimer.current = setTimeout(() => {
      setArmedState(false);
      lastTapRef.current = 0;
    }, 3000);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="SOS emergency button"
      onPress={handlePress}
      onPressIn={() => {
        pressScale.value = withTiming(0.96, { duration: 80 });
        pressOpacity.value = withTiming(0.85, { duration: 80 });
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, { damping: 15, stiffness: 200 });
        pressOpacity.value = withTiming(1, { duration: 150 });
      }}
    >
      <ReanimatedAnimated.View style={[styles.wrapper, pressAnimStyle]}>
        {/* Ring 2 — outermost */}
        <Animated.View
          style={[
            styles.ring2,
            { transform: [{ scale: ring2Anim }] },
          ]}
        />
        {/* Ring 1 */}
        <Animated.View
          style={[
            styles.ring1,
            { transform: [{ scale: ring1Anim }] },
          ]}
        />
        {/* Button — does not animate */}
        <View style={styles.button}>
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </ReanimatedAnimated.View>
    </Pressable>
  );
}

export default SOSEmergencyButton;

const styles = StyleSheet.create({
  wrapper: {
    width: RING2_SIZE,
    height: RING2_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring2: {
    position: 'absolute',
    width: RING2_SIZE,
    height: RING2_SIZE,
    borderRadius: RING2_SIZE / 2,
    backgroundColor: 'rgba(230,0,35,0.10)',
  },
  ring1: {
    position: 'absolute',
    width: RING1_SIZE,
    height: RING1_SIZE,
    borderRadius: RING1_SIZE / 2,
    backgroundColor: 'rgba(230,0,35,0.22)',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Emergency,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 1,
  },
});
