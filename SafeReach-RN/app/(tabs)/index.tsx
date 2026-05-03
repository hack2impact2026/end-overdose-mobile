import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useApp } from '../../src/AppContext'
import EmergencyActiveScreen from '../../src/screens/EmergencyActiveScreen'
import { colors, radius, font } from '../../src/theme'

const TIPS = [
  { icon: '📞', label: '911', sub: 'Call first' },
  { icon: '💊', label: 'Narcan', sub: 'If available' },
  { icon: '↩️', label: 'Recovery', sub: 'On their side' },
  { icon: '⏱', label: 'Stay', sub: 'Until EMS' },
]

export default function EmergencyTab() {
  const { emergencyActive, startEmergency, userName, saveUserName } = useApp()
  const insets = useSafeAreaInsets()
  const [time, setTime] = useState(new Date())
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(userName)

  // Animated rings
  const ring1 = useRef(new Animated.Value(0)).current
  const ring2 = useRef(new Animated.Value(0)).current
  const ring3 = useRef(new Animated.Value(0)).current
  const glowPulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const ticker = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(ticker)
  }, [])

  useEffect(() => {
    function animateRing(anim: Animated.Value, delay: number) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start()
    }
    animateRing(ring1, 0)
    animateRing(ring2, 800)
    animateRing(ring3, 1600)

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.94, duration: 1500, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  function handleSOS() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    startEmergency()
  }

  function saveName() {
    saveUserName(nameInput.trim())
    setEditingName(false)
  }

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const dayStr = dateStr.split(',')[0]

  if (emergencyActive) {
    return <EmergencyActiveScreen />
  }

  function ringStyle(anim: Animated.Value) {
    return {
      opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.7, 0.5, 0] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
    }
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Status bar */}
      <View style={s.statusBar}>
        <Text style={s.statusTime}>{timeStr}</Text>
        <View style={s.logoMark}>
          <View style={s.logoIcon}>
            <Text style={s.logoPlus}>+</Text>
          </View>
          <Text style={s.logoLabel}>SafeReach</Text>
        </View>
        <Text style={s.statusDate}>{dayStr}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Main */}
        <View style={s.main}>
          <View style={s.greeting}>
            {userName
              ? <Text style={s.greetText}>Ready, <Text style={{ color: colors.white }}>{userName}</Text></Text>
              : <Text style={s.greetText}>Stay Ready. Always.</Text>
            }
          </View>

          {/* SOS button */}
          <View style={s.sosContainer}>
            <Animated.View style={[s.ring, ringStyle(ring1)]} />
            <Animated.View style={[s.ring, ringStyle(ring2)]} />
            <Animated.View style={[s.ring, ringStyle(ring3)]} />
            <Animated.View style={{ transform: [{ scale: glowPulse }] }}>
              <TouchableOpacity style={s.sosBtn} onPress={handleSOS} activeOpacity={0.85}>
                <Text style={s.sosText}>SOS</Text>
                <Text style={s.sosSub}>EMERGENCY</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Text style={s.sosHint}>Tap to activate · AI companion connects instantly</Text>

          {/* Join session */}
          <TouchableOpacity style={s.joinBtn} onPress={() => router.push('/family-join')} activeOpacity={0.7}>
            <Text style={s.joinBtnText}>👥  Join a family emergency session</Text>
            <Text style={s.joinBtnArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Name prompt */}
        {!userName && (
          <View style={s.namePrompt}>
            {editingName ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={s.nameInputRow}>
                  <TextInput
                    style={s.nameInput}
                    value={nameInput}
                    onChangeText={setNameInput}
                    onSubmitEditing={saveName}
                    placeholder="Your name"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={s.nameSaveBtn} onPress={saveName}>
                    <Text style={s.nameSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            ) : (
              <TouchableOpacity style={s.namePromptRow} onPress={() => { setNameInput(''); setEditingName(true) }}>
                <Text style={{ color: colors.textSecondary, fontSize: font.sm }}>Add your name for emergency alerts</Text>
                <Text style={{ color: colors.red, fontSize: font.sm, fontWeight: '600' }}>Set →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tips */}
        <View style={s.tipsRow}>
          {TIPS.map(tip => (
            <View key={tip.label} style={s.tip}>
              <Text style={s.tipIcon}>{tip.icon}</Text>
              <Text style={s.tipLabel}>{tip.label}</Text>
              <Text style={s.tipSub}>{tip.sub}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8, paddingTop: 4 },
  statusTime: { fontSize: 13, fontWeight: '600', color: colors.textMuted, minWidth: 44 },
  logoMark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  logoPlus: { color: '#fff', fontSize: 14, fontWeight: '900', lineHeight: 18 },
  logoLabel: { fontSize: 14, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  statusDate: { fontSize: 12, color: colors.textMuted, minWidth: 44, textAlign: 'right' },
  scroll: { flexGrow: 1 },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 16, gap: 20, paddingTop: 24 },
  greeting: { alignItems: 'center' },
  greetText: { fontSize: font.md, color: colors.textMuted, fontWeight: '500' },
  sosContainer: {
    width: 220, height: 220,
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 220, height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(232,0,13,0.5)',
  },
  sosBtn: {
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: colors.red,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    gap: 2,
  },
  sosText: { fontSize: font['5xl'], fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sosSub: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 2.5 },
  sosHint: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', maxWidth: 230, lineHeight: 20 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    width: '100%', maxWidth: 340,
  },
  joinBtnText: { flex: 1, fontSize: font.sm, color: colors.textSecondary },
  joinBtnArrow: { fontSize: 18, color: colors.textMuted },
  namePrompt: {
    marginHorizontal: 16, marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(232,0,13,0.07)',
    borderWidth: 1, borderColor: colors.redBorder,
    borderRadius: radius.md,
  },
  namePromptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameInputRow: { flexDirection: 'row', gap: 8 },
  nameInput: {
    flex: 1, backgroundColor: '#222',
    borderWidth: 1, borderColor: colors.redBorder,
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: font.md, color: colors.white,
  },
  nameSaveBtn: { backgroundColor: colors.red, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  nameSaveBtnText: { color: '#fff', fontSize: font.sm, fontWeight: '600' },
  tipsRow: {
    flexDirection: 'row', gap: 1,
    marginBottom: 8, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#111111',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  tip: { flex: 1, alignItems: 'center', gap: 3 },
  tipIcon: { fontSize: 18 },
  tipLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  tipSub: { fontSize: 10, color: colors.textMuted },
})
