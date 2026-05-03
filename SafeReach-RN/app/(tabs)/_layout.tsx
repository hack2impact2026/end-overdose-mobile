import { Tabs } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../../src/AppContext'
import { colors } from '../../src/theme'
import Svg, { Path, Circle, Line } from 'react-native-svg'

function EmergencyIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M11 2L2 19h18L11 2Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"
        fill={color === colors.red ? 'rgba(232,0,13,0.15)' : 'none'} />
      <Line x1={11} y1={9} x2={11} y2={13} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={11} cy={16} r={0.9} fill={color} />
    </Svg>
  )
}

function ContactsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={9} cy={7} r={3.5} stroke={color} strokeWidth={1.7} />
      <Path d="M2 19c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M17 10l2 2 3-3" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function MapIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M11 2C7.134 2 4 5.134 4 9c0 5.25 7 11 7 11s7-5.75 7-11c0-3.866-3.134-7-7-7z"
        stroke={color} strokeWidth={1.7}
        fill={color === colors.red ? 'rgba(232,0,13,0.12)' : 'none'} />
      <Circle cx={11} cy={9} r={2.5} stroke={color} strokeWidth={1.5} />
    </Svg>
  )
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={8} r={4} stroke={color} strokeWidth={1.7} />
      <Path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
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
          backgroundColor: colors.bgCard2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
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
          title: 'Contacts',
          tabBarIcon: ({ color }) => <ContactsIcon color={color} />,
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
    backgroundColor: colors.red,
    borderWidth: 1.5,
    borderColor: colors.bgCard2,
  },
})
