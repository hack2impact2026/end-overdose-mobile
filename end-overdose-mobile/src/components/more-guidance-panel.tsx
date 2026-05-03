import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type MoreGuidancePanelProps = {
  items: string[];
};

export function MoreGuidancePanel({ items }: MoreGuidancePanelProps) {
  const [open, setOpen] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={buttonStyle}>
        <Pressable
          style={styles.toggle}
          onPress={() => setOpen((current) => !current)}
          onPressIn={() => {
            scale.value = withTiming(0.96, { duration: 80 });
            opacity.value = withTiming(0.85, { duration: 80 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 200 });
            opacity.value = withTiming(1, { duration: 150 });
          }}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Hide more guidance' : 'Show more guidance'}
          accessibilityState={{ expanded: open }}
        >
          <Text style={styles.toggleText}>{open ? 'Hide guidance' : 'More guidance'}</Text>
        </Pressable>
      </Animated.View>

      {open ? (
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {items.map((item, index) => (
            <View key={item} style={styles.row}>
              <Text style={styles.bullet}>{index + 1}</Text>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}

          <Pressable
            style={styles.closeButton}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 12,
  },
  toggle: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F4EDEE',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7D2A33',
    fontFamily: 'System',
  },
  sheet: {
    width: '100%',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: '#FFF7F7',
    borderWidth: 1,
    borderColor: '#F1D7DA',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E4C7CB',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  bullet: {
    minWidth: 18,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#B32335',
    fontFamily: 'System',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#3A2528',
    fontFamily: 'System',
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7D2A33',
    fontFamily: 'System',
  },
});
