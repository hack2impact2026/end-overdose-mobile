import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar } from '@/constants/theme';

const HIDDEN_SCREENS = new Set(['emergency-active', 'triage', 'emergency-911']);

const TABS = [
  {
    name: 'emergency',
    label: 'Emergency',
    icon: 'home-outline' as const,
    iconActive: 'home' as const,
  },
  {
    name: 'resources',
    label: 'Resources',
    icon: 'book-outline' as const,
    iconActive: 'book' as const,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-outline' as const,
    iconActive: 'person' as const,
  },
];

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.92 : 1, { duration: 80 }) }],
    opacity: withTiming(pressed.value ? 0.75 : 1, { duration: 80 }),
  }));

  return (
    <Pressable
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={() => { pressed.value = true; }}
      onPressOut={() => { pressed.value = false; }}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabContent, isActive && styles.tabContentActive, animatedStyle]}>
        <Ionicons
          name={isActive ? tab.iconActive : tab.icon}
          size={22}
          color={isActive ? TabBar.activeIcon : TabBar.inactiveIcon}
        />
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const currentName = state.routes[state.index]?.name;

  if (HIDDEN_SCREENS.has(currentName)) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {TABS.map((tab) => (
        <TabItem
          key={tab.name}
          tab={tab}
          isActive={currentName === tab.name}
          onPress={() => navigation.navigate(tab.name)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: TabBar.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TabBar.border,
    height: TabBar.height,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 2,
  },
  tabContentActive: {
    backgroundColor: TabBar.pillBackground,
  },
  label: {
    fontSize: 10,
    color: TabBar.inactiveLabel,
    fontFamily: 'System',
  },
  labelActive: {
    color: TabBar.activeLabel,
    fontWeight: '700',
  },
});
