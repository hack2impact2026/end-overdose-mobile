import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useApp } from '../../src/AppContext'
import EmergencyActiveScreen from '../../src/screens/EmergencyActiveScreen'

const RED = '#CC2222'
const RING_OUTER = 'rgba(204,34,34,0.10)'
const RING_INNER = 'rgba(204,34,34,0.18)'

export default function EmergencyTab() {
  const { emergencyActive, startEmergency } = useApp()
  const insets = useSafeAreaInsets()

  const ringOuterPulse = useRef(new Animated.Value(0)).current
  const ringInnerPulse = useRef(new Animated.Value(0)).current
  const sosPulse = useRef(new Animated.Value(0)).current
  const [sosArmed, setSosArmed] = useState(false)
  const lastTapAt = useRef(0)
  const armTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function ripple(val: Animated.Value, delay: number, duration: number) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
      animation.start()
      return animation
    }

    const outerRipple = ripple(ringOuterPulse, 0, 2200)
    const innerRipple = ripple(ringInnerPulse, 520, 1850)
    const buttonPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(sosPulse, {
          toValue: 0.28,
          duration: 260,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(sosPulse, {
          toValue: 0.62,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(sosPulse, {
          toValue: 0,
          duration: 820,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    )
    buttonPulse.start()

    return () => {
      outerRipple.stop()
      innerRipple.stop()
      buttonPulse.stop()
      if (armTimeout.current) clearTimeout(armTimeout.current)
    }
  }, [ringOuterPulse, ringInnerPulse, sosPulse])

  function handleSOS() {
    const now = Date.now()
    if (now - lastTapAt.current > 650) {
      lastTapAt.current = now
      setSosArmed(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      if (armTimeout.current) clearTimeout(armTimeout.current)
      armTimeout.current = setTimeout(() => {
        setSosArmed(false)
        lastTapAt.current = 0
      }, 650)
      return
    }

    if (armTimeout.current) clearTimeout(armTimeout.current)
    setSosArmed(false)
    lastTapAt.current = 0
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    startEmergency()
  }

  if (emergencyActive) {
    return <EmergencyActiveScreen />
  }

  const outerRingStyle = {
    opacity: ringOuterPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.78, 0],
    }),
    transform: [{
      scale: ringOuterPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.82, 1.14],
      }),
    }],
  }

  const innerRingStyle = {
    opacity: ringInnerPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.88, 0.22],
    }),
    transform: [{
      scale: ringInnerPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.84, 1.08],
      }),
    }],
  }

  const sosPulseStyle = {
    transform: [{
      scale: sosPulse.interpolate({
        inputRange: [0, 0.28, 0.62, 1],
        outputRange: [1, 0.985, 1.035, 1.06],
      }),
    }],
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Emergency Help</Text>
        <Text style={s.subtitle}>Notify your trusted contacts immediately.</Text>
      </View>

      <View style={s.center}>
        <View style={s.sosStack}>
          <Animated.View
            style={[s.ringOuter, outerRingStyle]}
          />
          <Animated.View
            style={[s.ringInner, innerRingStyle]}
          />
          <Animated.View style={sosPulseStyle}>
            <TouchableOpacity
              style={[s.sosBtn, sosArmed && s.sosBtnArmed]}
              onPress={handleSOS}
              activeOpacity={0.82}
            >
              <Text style={s.sosText}>SOS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Text style={[s.hint, sosArmed && s.hintArmed]}>
          {sosArmed ? 'Tap again to start emergency' : 'Double-tap to confirm'}
        </Text>
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={s.footerText}>
          This app coordinates support. It does not replace{'\n'}emergency services.
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingTop: 34,
    paddingHorizontal: 28,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'System',
    letterSpacing: 0,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7C7C84',
    fontFamily: 'System',
    lineHeight: 25,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 72,
    paddingHorizontal: 24,
  },
  sosStack: {
    width: 360,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: RING_OUTER,
  },
  ringInner: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: RING_INNER,
  },
  sosBtn: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CC2222',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  sosBtnArmed: {
    backgroundColor: '#B91C1C',
    transform: [{ scale: 1.04 }],
  },
  sosText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
    letterSpacing: 0,
  },
  hint: {
    fontSize: 18,
    color: '#77777E',
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 12,
  },
  hintArmed: {
    color: RED,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 0,
  },
  footerText: {
    fontSize: 14,
    color: '#AEAEB2',
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: 18,
  },
})
