import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const BUTTON_SIZE = 52;
const INNER_SIZE = 42;
const HALF = BUTTON_SIZE / 2;
const HOLD_DURATION_MS = 1000;
const RING_WIDTH = 3;

type HoldToCancelButtonProps = {
  onComplete: () => void;
  label?: string;
  accessibilityLabel?: string;
};

export function HoldToCancelButton({
  onComplete,
  label,
  accessibilityLabel = 'Hold to cancel emergency flow',
}: HoldToCancelButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const progress = useSharedValue(0);
  const didCompleteRef = useRef(false);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  function startHold() {
    didCompleteRef.current = false;
    scale.value = withTiming(0.96, { duration: 80 });
    opacity.value = withTiming(0.85, { duration: 80 });

    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: HOLD_DURATION_MS });
  }

  function cancelHold() {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 150 });

    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: didCompleteRef.current ? 0 : 180 });
  }

  function completeHold() {
    if (didCompleteRef.current) {
      return;
    }

    // Let the native long-press event decide completion timing.
    // The ring animation is only visual, which keeps the interaction predictable.
    didCompleteRef.current = true;
    progress.value = 1;
    onComplete();
  }

  const rightStyle = useAnimatedStyle(() => {
    const deg = interpolate(progress.value, [0, 0.5], [-180, 0], Extrapolation.CLAMP);
    // Fade in right half at its entry (progress 0) to hide the north/south border cap pop
    const op = interpolate(progress.value, [0, 0.04], [0, 1], Extrapolation.CLAMP);
    return { opacity: op, transform: [{ rotateZ: `${deg}deg` }] };
  });

  const leftStyle = useAnimatedStyle(() => {
    const deg = interpolate(progress.value, [0.5, 1], [-180, 0], Extrapolation.CLAMP);
    // Fade in left half at its entry (progress 0.5) to hide the south seam pop
    const op = interpolate(progress.value, [0.5, 0.54], [0, 1], Extrapolation.CLAMP);
    return { opacity: op, transform: [{ rotateZ: `${deg}deg` }] };
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={buttonStyle}>
        <Pressable
          onPressIn={startHold}
          onLongPress={completeHold}
          delayLongPress={HOLD_DURATION_MS}
          onPressOut={cancelHold}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Press and hold for one second to cancel or go back."
        >
          <View style={styles.track} />

          <View style={styles.rightClip} pointerEvents="none">
            <Animated.View style={[styles.progressHalf, styles.rightHalf, rightStyle]} />
          </View>

          <View style={styles.leftClip} pointerEvents="none">
            <Animated.View style={[styles.progressHalf, styles.leftHalf, leftStyle]} />
          </View>

          <View style={styles.innerButton} pointerEvents="none" />

          <View style={styles.iconContainer} pointerEvents="none">
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </View>
        </Pressable>
      </Animated.View>

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    width: 96,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: HALF,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: HALF,
    borderWidth: RING_WIDTH,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  rightClip: {
    position: 'absolute',
    width: HALF,
    height: BUTTON_SIZE,
    right: 0,
    borderTopRightRadius: HALF,
    borderBottomRightRadius: HALF,
    overflow: 'hidden',
  },
  leftClip: {
    position: 'absolute',
    width: HALF,
    height: BUTTON_SIZE,
    left: 0,
    borderTopLeftRadius: HALF,
    borderBottomLeftRadius: HALF,
    overflow: 'hidden',
  },
  progressHalf: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: HALF,
    borderWidth: RING_WIDTH,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  rightHalf: {
    // offset left by HALF so the ring center aligns with the button center, not the clip edge
    left: -HALF,
    borderLeftColor: 'transparent',
  },
  leftHalf: {
    borderRightColor: 'transparent',
  },
  innerButton: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: 'rgba(255,170,182,0.34)',
  },
  iconContainer: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
});
