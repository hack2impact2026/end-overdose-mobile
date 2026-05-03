import { useRef } from 'react'
import { Text, Animated, Pressable, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { lightColors as L } from '../theme'

type Props = {
  onBack: () => void
  onHoldComplete?: () => void
  holdMs?: number
  tone?: 'emergency' | 'light'
  style?: object
}

const SIZE = 58
const BUTTON_SIZE = 46
const STROKE = 3
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export default function EmergencyBackButton({
  onBack,
  onHoldComplete,
  holdMs = 1000,
  tone = 'emergency',
  style,
}: Props) {
  const fired = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progress = useRef(new Animated.Value(0)).current
  const currentAnim = useRef<Animated.CompositeAnimation | null>(null)
  const isEmergency = tone === 'emergency'

  function handlePressIn() {
    fired.current = false
    if (!onHoldComplete) return
    currentAnim.current = Animated.timing(progress, {
      toValue: 1,
      duration: holdMs,
      useNativeDriver: false,
    })
    currentAnim.current.start()
    timer.current = setTimeout(() => {
      fired.current = true
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start()
      onHoldComplete()
    }, holdMs)
  }

  function handlePressOut() {
    if (fired.current) return
    if (timer.current) clearTimeout(timer.current)
    currentAnim.current?.stop()
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: false }).start()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onBack()
  }

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  })

  return (
    <Pressable
      style={[s.wrap, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="Back"
      accessibilityHint={onHoldComplete ? 'Hold to exit emergency' : undefined}
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={s.spinner}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={isEmergency ? 'rgba(255,255,255,0.22)' : 'rgba(204,34,34,0.16)'}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={isEmergency ? '#FFFFFF' : L.red}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={SIZE / 2}
          originY={SIZE / 2}
        />
      </Svg>
      <Animated.View style={[
        s.btn,
        isEmergency ? s.btnEmergency : s.btnLight,
      ]}>
        <Text style={[s.chevron, isEmergency ? s.chevronEmergency : s.chevronLight]}>‹</Text>
      </Animated.View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  wrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    position: 'absolute',
  },
  btn: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEmergency: {
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: '#EF4B5E',
    shadowColor: L.red,
    shadowOpacity: 0.36,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  btnLight: {
    borderColor: 'rgba(204,34,34,0.2)',
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(15,23,42,0.18)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  chevron: {
    fontSize: 34,
    lineHeight: 34,
    fontFamily: 'System',
    fontWeight: '300',
    marginTop: -2,
  },
  chevronEmergency: {
    color: '#FFFFFF',
  },
  chevronLight: {
    color: L.red,
  },
})
