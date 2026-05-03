import { Tabs } from 'expo-router'
import { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
import * as Haptics from 'expo-haptics'
import { useApp } from '../../src/AppContext'
import Svg, { Path, Circle, Line } from 'react-native-svg'

const TAB_ACTIVE = '#CC2222'
const TAB_INACTIVE = '#8E8E93'
const TAB_BG = 'rgba(255,255,255,0.94)'
const TAB_BORDER = 'rgba(60,60,67,0.12)'
const TAB_PRESS = 'rgba(204,34,34,0.08)'
const TAB_SHADOW = 'rgba(15,23,42,0.10)'

function isActive(color: string) {
  return color === TAB_ACTIVE
}

function EmergencyIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M11 2L2 19h18L11 2Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"
        fill={isActive(color) ? 'rgba(204,34,34,0.15)' : 'none'} />
      <Line x1={11} y1={9} x2={11} y2={13} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={11} cy={16} r={0.9} fill={color} />
    </Svg>
  )
}

function ResourcesIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M4 4h6a2 2 0 0 1 2 2v13" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 4h-6a2 2 0 0 0-2 2v13" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 4v15h16V4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function MapIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M8 4.5 3 6.5v11l5-2 6 2 5-2v-11l-5 2-6-2Z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Path d="M8 4.5v11M14 6.5v11" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M11 8.5c1.1 0 2 .9 2 2 0 1.7-2 3.5-2 3.5s-2-1.8-2-3.5c0-1.1.9-2 2-2Z" fill={color} />
      <Circle cx={11} cy={10.5} r={0.55} fill={TAB_BG} />
    </Svg>
  )
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={8} r={3.5} stroke={color} strokeWidth={1.7} />
      <Path d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7"
        stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  )
}

function AppleTabBarButton({
  accessibilityLabel,
  accessibilityLargeContentTitle,
  accessibilityRole,
  accessibilityState,
  children,
  onPress,
  onLongPress,
  testID,
}: BottomTabBarButtonProps) {
  const focused = !!accessibilityState?.selected
  const scale = useRef(new Animated.Value(focused ? 1 : 0.98)).current
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.92)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.98,
        useNativeDriver: true,
        speed: 22,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.92,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start()
  }, [focused, opacity, scale])

  function handlePress(...args: Parameters<NonNullable<BottomTabBarButtonProps['onPress']>>) {
    Haptics.selectionAsync()
    onPress?.(...args)
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityLargeContentTitle={accessibilityLargeContentTitle}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      onPress={handlePress}
      onLongPress={onLongPress}
      testID={testID}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.94,
          useNativeDriver: true,
          speed: 30,
          bounciness: 0,
        }).start()
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: focused ? 1 : 0.98,
          useNativeDriver: true,
          speed: 24,
          bounciness: 6,
        }).start()
      }}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.item,
          focused && styles.itemActive,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  )
}

export default function TabsLayout() {
  const { emergencyActive } = useApp()
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: emergencyActive ? 'none' : 'flex',
          backgroundColor: TAB_BG,
          borderTopColor: TAB_BORDER,
          borderTopWidth: 0,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          marginHorizontal: 14,
          marginBottom: 10,
          borderRadius: 28,
          position: 'absolute',
          shadowColor: TAB_SHADOW,
          shadowOpacity: 1,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarItemStyle: {
          height: 44,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: -0.1,
          fontFamily: 'System',
          marginBottom: 2,
        },
        tabBarButton: (props) => <AppleTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Emergency',
          tabBarIcon: ({ color }) => (
            <View>
              <EmergencyIcon color={color} />
              {emergencyActive && <View style={styles.dot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color }) => <ResourcesIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <MapIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TAB_ACTIVE,
    borderWidth: 1.5,
    borderColor: TAB_BG,
  },
  pressable: {
    flex: 1,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: TAB_PRESS,
  },
})
