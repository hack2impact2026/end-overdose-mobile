import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type GuidedFlowBackButtonProps = {
  onPress: () => void;
  onHoldComplete?: () => void;
  accessibilityLabel?: string;
};

export function GuidedFlowBackButton({
  onPress,
  onHoldComplete,
  accessibilityLabel = 'Go back',
}: GuidedFlowBackButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const progress = useSharedValue(0);
  const didLongPressRef = useRef(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const rightStyle = useAnimatedStyle(() => {
    const deg = interpolate(progress.value, [0, 0.5], [-180, 0], Extrapolation.CLAMP);
    // Fade in at entry to hide the north/south border cap pop
    const op = interpolate(progress.value, [0, 0.04], [0, 1], Extrapolation.CLAMP);
    return { opacity: op, transform: [{ rotateZ: `${deg}deg` }] };
  });

  const leftStyle = useAnimatedStyle(() => {
    const deg = interpolate(progress.value, [0.5, 1], [-180, 0], Extrapolation.CLAMP);
    // Fade in at its entry point (0.5) to hide the south seam pop
    const op = interpolate(progress.value, [0.5, 0.54], [0, 1], Extrapolation.CLAMP);
    return { opacity: op, transform: [{ rotateZ: `${deg}deg` }] };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          didLongPressRef.current = false;
          scale.value = withTiming(0.96, { duration: 80 });
          opacity.value = withTiming(0.9, { duration: 80 });
          cancelAnimation(progress);
          progress.value = 0;
          progress.value = withTiming(1, { duration: 1000 });
        }}
        onLongPress={() => {
          didLongPressRef.current = true;
          if (onHoldComplete) {
            onHoldComplete();
          }
        }}
        delayLongPress={1000}
        onPress={() => {
          if (!didLongPressRef.current) {
            onPress();
          }
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
          opacity.value = withTiming(1, { duration: 150 });
          cancelAnimation(progress);
          progress.value = withTiming(0, { duration: didLongPressRef.current ? 0 : 140 });
        }}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={
          onHoldComplete
            ? 'Tap to go back one step. Press and hold for one second to return home.'
            : undefined
        }
      >
        <View style={styles.track} />

        <View style={styles.rightClip} pointerEvents="none">
          <Animated.View style={[styles.progressHalf, styles.rightHalf, rightStyle]} />
        </View>

        <View style={styles.leftClip} pointerEvents="none">
          <Animated.View style={[styles.progressHalf, styles.leftHalf, leftStyle]} />
        </View>

        <View style={styles.button}>
          <Ionicons name="chevron-back" size={22} color="#D94B4B" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(235,193,193,0.75)',
  },
  rightClip: {
    position: 'absolute',
    width: 24,
    height: 48,
    right: 0,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  leftClip: {
    position: 'absolute',
    width: 24,
    height: 48,
    left: 0,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  progressHalf: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D94B4B',
    backgroundColor: 'transparent',
  },
  rightHalf: {
    left: -24,
    borderLeftColor: 'transparent',
  },
  leftHalf: {
    borderRightColor: 'transparent',
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0D7D7',
    shadowColor: '#E88989',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },
});
