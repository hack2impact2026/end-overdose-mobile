import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Share, Linking, Platform, Image, Animated, Easing, Pressable,
  StyleProp, ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import { StatusBar } from 'expo-status-bar'
import { useApp } from '../AppContext'
import ChatInterface from '../components/ChatInterface'
import EmergencyBackButton from '../components/EmergencyBackButton'
import { getSession, updateSession, calculateETA } from '../utils/session'
import { lightColors as L } from '../theme'

const CHECK_RESPONSE_IMAGE = require('../../assets/emergency-hero.png')

type Step = 1 | 2 | 3 | 'guidance'
type GuidanceMode = 'awake' | 'emergency'

const STEPS: { n: 1 | 2 | 3; key: string; label: string }[] = [
  { n: 1, key: 'diagnosis', label: 'Diagnosis' },
  { n: 2, key: 'treatment', label: 'Treatment' },
  { n: 3, key: 'guide', label: 'AI Guide' },
]

const NARCAN_ACTIONS = [
  'Call 911 now',
  'Lay them on their back briefly',
  'Spray into one nostril and press fully',
  'Put them on their side once breathing is supported',
]

function elapsed(secs: number) {
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

export default function EmergencyActiveScreen() {
  const {
    sessionCode, endEmergency, setChatHistory,
    naloxoneGiven, setNaloxoneGiven, userName, location, setLocation, visionResult,
  } = useApp()
  const insets = useSafeAreaInsets()

  const [introVisible, setIntroVisible] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [secs, setSecs] = useState(0)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [alertShared, setAlertShared] = useState(false)
  const [chatExpanded, setChatExpanded] = useState(false)
  const [naloxoneAt, setNaloxoneAt] = useState<number | null>(null)
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>('emergency')

  const locationRef = useRef(location)
  const naloxoneRef = useRef(naloxoneGiven)
  const prevFamilyCount = useRef(0)

  useEffect(() => { locationRef.current = location }, [location])
  useEffect(() => { naloxoneRef.current = naloxoneGiven }, [naloxoneGiven])

  // Timer
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-fetch GPS
  useEffect(() => {
    fetchGPS()
  }, [])

  // Poll session
  useEffect(() => {
    if (!sessionCode) return
    const tick = async () => {
      const session = await getSession(sessionCode)
      if (!session) return

      if (locationRef.current) {
        await updateSession(sessionCode, {
          victimLocation: locationRef.current,
          victimLastSeen: Date.now(),
          naloxoneGiven: naloxoneRef.current,
        })
      }

      const members = session.familyMembers || []
      if (members.length > prevFamilyCount.current) {
        const newMember = members[members.length - 1]
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        let msgText = `${newMember.name} just joined your session. They're on their way to help you.`
        if (locationRef.current && newMember.location) {
          const { distance, eta } = calculateETA(locationRef.current, newMember.location)
          msgText = `${newMember.name} just joined. They're ${distance} miles away — about ${eta} min. Help is coming.`
        }
        const aiMsg = { role: 'assistant' as const, content: msgText, id: `fam_${Date.now()}` }
        setChatHistory(prev => [...prev, aiMsg])
      }
      setFamilyMembers([...members])
      prevFamilyCount.current = members.length
    }

    tick()
    const interval = setInterval(tick, 5000)
    return () => clearInterval(interval)
  }, [sessionCode])

  async function fetchGPS() {
    setGpsLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setGpsLoading(false); return }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setLocation(loc)
      if (sessionCode) {
        await updateSession(sessionCode, { victimLocation: loc, victimLastSeen: Date.now() })
      }
    } catch {}
    setGpsLoading(false)
  }

  async function shareAlert() {
    if (!sessionCode) return
    const locPart = location ? `&lat=${location.lat.toFixed(5)}&lng=${location.lng.toFixed(5)}` : ''
    const namePart = userName ? `&name=${encodeURIComponent(userName)}` : ''
    const url = `https://safereach-theta.vercel.app/join/${sessionCode}?${locPart}${namePart}`.replace('?&', '?')
    const msg = `${userName || 'Someone'} needs help. Join their SafeReach session to see their live location:\n${url}\n\nCode: ${sessionCode}`
    try {
      await Share.share({ message: msg })
      setAlertShared(true)
    } catch {}
  }

  function handleEndEmergency() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    endEmergency()
  }

  function advance(next: Step) {
    Haptics.selectionAsync()
    setStep(next)
  }

  function openGuidance(mode: GuidanceMode) {
    setGuidanceMode(mode)
    advance('guidance')
  }

  function handleStepBack() {
    if (step === 1) setIntroVisible(true)
    else if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
    // guidance keeps the hold-to-exit control; flow back is only shown in the 3-step path
  }

  function call911() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Linking.openURL('tel:911')
  }

  async function handleNeedHelp() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    call911()
    await shareAlert()
  }

  if (introVisible) {
    return (
      <EmergencyIntroScreen
        topInset={insets.top}
        bottomInset={insets.bottom}
        onExit={handleEndEmergency}
        onNeedHelp={handleNeedHelp}
        onReadyToHelp={() => {
          Haptics.selectionAsync()
          setIntroVisible(false)
        }}
      />
    )
  }

  return (

    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerSide} />
        <Text style={s.sessionCode}>{sessionCode}</Text>
        <View style={s.headerTimer}>
          <View style={s.activeDot} />
          <Text style={s.timerText}>{elapsed(secs)}</Text>
        </View>
      </View>

      {/* Family pills */}
      {familyMembers.length > 0 && (
        <View style={s.familyBar}>
          <Text style={s.familyLabel}>On the way</Text>
          {familyMembers.map((m, i) => (
            <View key={i} style={s.familyChip}>
              <Text style={s.familyChipText}>{m.name}</Text>
            </View>
          ))}
        </View>
      )}

      {step !== 'guidance' ? (
        <>
          <EmergencyBackButton
            onBack={() => {}}
            onHoldComplete={handleEndEmergency}
            tone="light"
            style={[s.exitBackButton, s.flowExitBackButton]}
          />
          <Text style={[s.exitBackHint, s.flowExitBackHint]}>HOLD TO EXIT</Text>
          <View style={s.stepArea}>
            <StepCard
              step={step}
              onOpenGuidance={openGuidance}
              onStartTreatment={() => advance(2)}
              onCall911={call911}
              onNaloxoneComplete={() => {
                setNaloxoneGiven(true)
                setNaloxoneAt(secs)
                openGuidance('emergency')
              }}
            />
            <StepBottomControls
              current={step}
              bottom={insets.bottom + 24}
              onBack={handleStepBack}
            />
          </View>
        </>
      ) : (
        <MoreGuidancePanel
          gpsLoading={gpsLoading}
          location={location}
          onGetLocation={fetchGPS}
          alertShared={alertShared}
          onAlertContacts={shareAlert}
          mode={guidanceMode}
          sessionCode={sessionCode}
          naloxoneGiven={naloxoneGiven}
          naloxoneElapsedSecs={naloxoneAt === null ? null : secs - naloxoneAt}
          visionResult={visionResult}
          chatExpanded={chatExpanded}
          onToggleChatExpanded={() => setChatExpanded(v => !v)}
          onEnd={handleEndEmergency}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  )
}

function EmergencyIntroScreen({
  topInset,
  bottomInset,
  onExit,
  onNeedHelp,
  onReadyToHelp,
}: {
  topInset: number
  bottomInset: number
  onExit: () => void
  onNeedHelp: () => void
  onReadyToHelp: () => void
}) {
  const introFade = useRef(new Animated.Value(0)).current
  const introLift = useRef(new Animated.Value(20)).current
  const iconFloat = useRef(new Animated.Value(0)).current
  const iconPop = useRef(new Animated.Value(0.88)).current
  const auraPulse = useRef(new Animated.Value(0)).current
  const buttonLift = useRef(new Animated.Value(18)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(introFade, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(introLift, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(iconPop, {
        toValue: 1,
        friction: 6,
        tension: 88,
        useNativeDriver: true,
      }),
      Animated.timing(buttonLift, {
        toValue: 0,
        delay: 130,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloat, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconFloat, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    const auraLoop = Animated.loop(
      Animated.timing(auraPulse, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    )
    floatLoop.start()
    auraLoop.start()
    return () => {
      floatLoop.stop()
      auraLoop.stop()
    }
  }, [auraPulse, buttonLift, iconFloat, iconPop, introFade, introLift])

  const auraStyle = {
    opacity: auraPulse.interpolate({
      inputRange: [0, 0.72, 1],
      outputRange: [0.22, 0.08, 0.22],
    }),
    transform: [{
      scale: auraPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.82, 1.16],
      }),
    }],
  }

  const iconMotion = {
    opacity: introFade,
    transform: [
      { scale: iconPop },
      {
        translateY: iconFloat.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  }

  return (
    <View style={[s.introScreen, { paddingTop: topInset, paddingBottom: bottomInset + 28 }]}>
      <StatusBar style="light" backgroundColor="#EF0026" />
      <EmergencyBackButton
        onBack={() => {}}
        onHoldComplete={onExit}
        tone="emergency"
        style={[s.exitBackButton, s.flowExitBackButton]}
      />
      <Text style={[s.exitBackHint, s.flowExitBackHint, s.exitBackHintOnRed]}>HOLD TO EXIT</Text>
      <View style={s.introBody}>
        <Animated.View pointerEvents="none" style={[s.introAura, auraStyle]} />
        <Animated.View pointerEvents="none" style={[s.introAuraInner, auraStyle]} />
        <Animated.View style={iconMotion}>
          <Text style={s.introIcon}>🚑</Text>
        </Animated.View>
        <Animated.View style={{ opacity: introFade, transform: [{ translateY: introLift }] }}>
          <Text style={s.introTitle}>Take a deep breath{'\n'}EMS is on the way</Text>
        </Animated.View>
        <Animated.View style={[s.introActions, { opacity: introFade, transform: [{ translateY: buttonLift }] }]}>
          <HoverButton
            style={s.introButton}
            hoverStyle={s.introButtonHover}
            pressedStyle={s.introButtonPressed}
            onPress={onNeedHelp}
            accessibilityLabel="I need help"
          >
            <Text style={s.introButtonText}>I NEED HELP</Text>
          </HoverButton>
          <HoverButton
            style={s.introButton}
            hoverStyle={s.introButtonHover}
            pressedStyle={s.introButtonPressed}
            onPress={onReadyToHelp}
            accessibilityLabel="I'm ready to help"
          >
            <Text style={s.introButtonText}>I'M READY TO HELP</Text>
          </HoverButton>
        </Animated.View>
      </View>
    </View>
  )
}

function HoverButton({
  children,
  style,
  hoverStyle,
  pressedStyle,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode
  style: StyleProp<ViewStyle>
  hoverStyle?: StyleProp<ViewStyle>
  pressedStyle?: StyleProp<ViewStyle>
  onPress: () => void | Promise<void>
  accessibilityLabel?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ hovered, pressed }) => [
        style,
        hovered && hoverStyle,
        pressed && pressedStyle,
      ]}
    >
      {children}
    </Pressable>
  )
}

function StepPill({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={s.pillRow}>
      {STEPS.map(({ n, label }) => {
        const active = n === current
        const done = n < current
        return (
          <View key={n} style={s.pillItem}>
            <View style={[
              s.pillDot,
              active && s.pillDotActive,
              done && s.pillDotDone,
            ]}>
              <Text style={[
                s.pillDotText,
                (active || done) && { color: '#fff' },
              ]}>{done ? '✓' : n}</Text>
            </View>
            <Text style={[
              s.pillLabel,
              active && { color: L.textPrimary, fontWeight: '600' },
            ]}>{label}</Text>
          </View>
        )
      })}
    </View>
  )
}

function StepBottomControls({
  current,
  bottom,
  onBack,
}: {
  current: 1 | 2 | 3
  bottom: number
  onBack: () => void
}) {
  return (
    <View style={[s.bottomControls, { bottom }]}>
      <HoverButton
        style={s.stepBackCircle}
        hoverStyle={s.hoverLift}
        pressedStyle={s.hoverPressed}
        onPress={onBack}
        accessibilityLabel={current === 1 ? 'Back to emergency intro' : 'Previous step'}
      >
        <Text style={s.stepBackChevron}>‹</Text>
      </HoverButton>
      <View style={s.bottomCheckpoints}>
        <StepPill current={current} />
      </View>
    </View>
  )
}

interface StepCardProps {
  step: 1 | 2 | 3
  onOpenGuidance: (mode: GuidanceMode) => void
  onStartTreatment: () => void
  onCall911: () => void
  onNaloxoneComplete: () => void
}

function StepCard({ step, onOpenGuidance, onStartTreatment, onCall911, onNaloxoneComplete }: StepCardProps) {
  const [narcanDone, setNarcanDone] = useState<Record<string, boolean>>({})
  const allNarcanDone = NARCAN_ACTIONS.every(action => narcanDone[action])

  function toggleNarcanAction(action: string) {
    Haptics.selectionAsync()
    setNarcanDone(prev => {
      const nextDone = !prev[action]
      if (nextDone && action === NARCAN_ACTIONS[0]) onCall911()
      return { ...prev, [action]: nextDone }
    })
  }

  if (step === 1) {
    return (
      <View style={s.stepCanvas}>
        <Text style={s.stepTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
          Is this an Overdose?
        </Text>
        <Image
          source={CHECK_RESPONSE_IMAGE}
          style={s.stepImage}
          resizeMode="contain"
        />
        <View style={s.checklist}>
          <Text style={s.checklistTitle}>Check them now</Text>
          <Text style={s.checklistItem}>Tap them and shout their name.</Text>
          <Text style={s.checklistItem}>Look for slow or no breathing.</Text>
        </View>
        <View style={s.responseChoices}>
          <HoverButton style={s.responseChoice} hoverStyle={s.hoverLift} pressedStyle={s.hoverPressed} onPress={() => onOpenGuidance('awake')}>
            <Text style={s.responseChoiceText}>Awake</Text>
          </HoverButton>
          <HoverButton
            style={s.responseChoice}
            hoverStyle={s.hoverLift}
            pressedStyle={s.hoverPressed}
            onPress={() => {
              onStartTreatment()
            }}
          >
            <Text style={s.responseChoiceText}>Unresponsive</Text>
          </HoverButton>
        </View>
      </View>
    )
  }
  if (step === 2) {
    return (
      <View style={s.stepCanvas}>
        <Text style={s.stepTitle}>Administer Narcan{'\n'}(Naloxone)</Text>
        <Text style={s.narcanSubtitle}>Tap each action as you complete it.</Text>
        <View style={s.narcanChecklist}>
          {NARCAN_ACTIONS.map((action) => {
            const done = !!narcanDone[action]
            return (
              <Pressable
                key={action}
                style={s.narcanRow}
                onPress={() => toggleNarcanAction(action)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
              >
                <View style={[s.narcanDot, done && s.narcanDotDone]} />
                <Text style={[s.narcanText, done && s.narcanTextDone]}>{action}</Text>
              </Pressable>
            )
          })}
        </View>
        <Pressable
          style={[s.completeBtn, allNarcanDone && s.completeBtnReady]}
          onPress={onNaloxoneComplete}
          disabled={!allNarcanDone}
          accessibilityRole="button"
          accessibilityState={{ disabled: !allNarcanDone }}
        >
          <Text style={[s.completeBtnText, allNarcanDone && s.completeBtnTextReady]}>
            {allNarcanDone ? 'Completed' : 'Please Complete'}
          </Text>
        </Pressable>
      </View>
    )
  }
  return null
}

interface MorePanelProps {
  gpsLoading: boolean
  location: { lat: number; lng: number } | null
  onGetLocation: () => void
  alertShared: boolean
  onAlertContacts: () => void
  mode: GuidanceMode
  sessionCode: string | null
  naloxoneGiven: boolean
  naloxoneElapsedSecs: number | null
  visionResult: string | null
  chatExpanded: boolean
  onToggleChatExpanded: () => void
  onEnd: () => void
  bottomInset: number
}

function MoreGuidancePanel(p: MorePanelProps) {
  const isAwake = p.mode === 'awake'

  return (
    <View style={s.guidanceScreen}>
      <View style={s.guidanceExitRow}>
        <HoverButton
          style={s.guidanceExitButton}
          hoverStyle={s.hoverLift}
          pressedStyle={s.hoverPressed}
          onPress={p.onEnd}
          accessibilityLabel="Exit emergency session"
        >
          <Text style={s.guidanceExitText}>Exit</Text>
        </HoverButton>
      </View>
      {!p.chatExpanded && (
        <View style={s.guidanceTop}>
          <Text style={s.guidanceHeading}>Monitor them</Text>
          <Text style={s.guidanceSub}>Stay close. Watch for changes.</Text>

          <View style={s.priorityCard}>
            <Text style={s.priorityTitle}>3-step plan</Text>
            {isAwake ? (
              <>
                <Text style={s.priorityText}>1. Keep them awake</Text>
                <Text style={s.priorityText}>2. Watch breathing</Text>
                <Text style={s.priorityText}>3. Call 911 if worse</Text>
              </>
            ) : (
              <>
                <Text style={s.priorityText}>1. Keep them on their side</Text>
                <Text style={s.priorityText}>2. Watch breathing closely</Text>
                <Text style={s.priorityText}>3. Give second dose if no response in 3 min</Text>
              </>
            )}
          </View>

          {p.naloxoneGiven && (
            <View style={s.statusRow}>
              <Text style={s.statusRowText}>
                Naloxone given{p.naloxoneElapsedSecs === null ? '' : ` - ${elapsed(p.naloxoneElapsedSecs)} ago`}
              </Text>
            </View>
          )}
        </View>
      )}
      <View style={[
        s.chatWrap,
        p.chatExpanded && s.chatWrapExpanded,
        { marginBottom: p.bottomInset + 12 },
      ]}>
        <ChatInterface
          guidanceMode={p.mode}
          expanded={p.chatExpanded}
          onToggleExpanded={p.onToggleChatExpanded}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: L.bg },

  // Intro
  introScreen: {
    flex: 1,
    backgroundColor: '#EF0026',
  },
  introBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 30,
    overflow: 'hidden',
  },
  introAura: {
    position: 'absolute',
    width: 430,
    height: 430,
    borderRadius: 215,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: '20%',
  },
  introAuraInner: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.16)',
    top: '27%',
  },
  introIcon: {
    fontSize: 124,
    lineHeight: 132,
    marginBottom: 16,
  },
  introTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    fontFamily: 'System',
    textAlign: 'center',
  },
  introActions: {
    width: '100%',
    gap: 16,
    marginTop: 22,
  },
  introButton: {
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(113,0,18,0.28)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  introButtonHover: {
    transform: [{ translateY: -3 }, { scale: 1.02 }],
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  introButtonPressed: {
    transform: [{ translateY: 1 }, { scale: 0.985 }],
    backgroundColor: '#FFF2F4',
  },
  introButtonText: {
    color: '#EF0026',
    fontSize: 19,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0,
  },
  hoverLift: {
    transform: [{ translateY: -2 }, { scale: 1.015 }],
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  hoverPressed: {
    transform: [{ translateY: 1 }, { scale: 0.985 }],
    opacity: 0.92,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: L.border,
  },
  headerSide: { width: 74 },
  headerTimer: { width: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: L.red },
  timerText: { fontSize: 17, fontWeight: '700', color: L.textPrimary, fontVariant: ['tabular-nums'], fontFamily: 'System' },
  sessionCode: {
    fontSize: 12, fontWeight: '600', color: L.red, letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Family
  familyBar: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: L.greenSoft,
    borderBottomWidth: 1, borderBottomColor: 'rgba(22,163,74,0.18)',
  },
  familyLabel: { fontSize: 12, color: L.green, fontWeight: '600' },
  familyChip: {
    backgroundColor: '#fff', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)',
  },
  familyChipText: { fontSize: 11, fontWeight: '600', color: L.green },

  // Step area
  stepArea: { flex: 1, paddingHorizontal: 32, paddingTop: 78, paddingBottom: 112 },
  exitBackButton: {
    position: 'absolute',
    top: 50,
    left: 30,
    zIndex: 10,
  },
  flowExitBackButton: {
    top: 64,
  },
  exitBackHint: {
    position: 'absolute',
    top: 50,
    left: 19,
    width: 80,
    zIndex: 10,
    color: L.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'System',
    textAlign: 'center',
    letterSpacing: 0,
  },
  flowExitBackHint: {
    top: 124,
  },
  exitBackHintOnRed: {
    color: 'rgba(255,255,255,0.82)',
  },

  // Pill row
  bottomControls: {
    position: 'absolute',
    left: 52,
    right: 52,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBackCircle: {
    position: 'absolute',
    left: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: L.red,
    borderWidth: 1,
    borderColor: L.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(204,34,34,0.28)',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  stepBackChevron: {
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 42,
    fontWeight: '300',
    fontFamily: 'System',
    marginTop: -3,
  },
  bottomCheckpoints: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    shadowColor: 'rgba(15,23,42,0.12)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pillRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  pillItem: { alignItems: 'center', justifyContent: 'center' },
  pillDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#A7A7AF',
    alignItems: 'center', justifyContent: 'center',
  },
  pillDotActive: { width: 36, backgroundColor: L.red },
  pillDotDone: { backgroundColor: '#A7A7AF' },
  pillDotText: { display: 'none' },
  pillLabel: { display: 'none' },

  // Card
  stepCanvas: {
    flex: 1,
    backgroundColor: L.bg,
  },
  stepTitle: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    color: L.textPrimary,
    fontFamily: 'System',
    marginBottom: 18,
  },
  card: {
    backgroundColor: L.surface,
    borderRadius: 20,
    padding: 24,
    gap: 8,
    borderWidth: 1, borderColor: L.border,
  },
  cardEyebrow: { fontSize: 12, fontWeight: '600', color: L.red, letterSpacing: 1, textTransform: 'uppercase' },
  cardTitle: { fontSize: 26, fontWeight: '700', color: L.textPrimary, fontFamily: 'System', letterSpacing: -0.4 },
  cardBody: { fontSize: 16, color: L.textSecondary, fontFamily: 'System', marginBottom: 8 },
  stepImage: {
    width: '100%',
    height: 168,
    marginBottom: 22,
    opacity: 0.96,
  },
  checklist: { gap: 11 },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: L.red,
    letterSpacing: 0,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  checklistItem: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '600',
    color: L.textPrimary,
    fontFamily: 'System',
  },
  responseChoices: {
    gap: 9,
    marginTop: 18,
  },
  responseChoice: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: L.borderStrong,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  responseChoiceText: {
    fontSize: 18,
    fontWeight: '600',
    color: L.textPrimary,
    fontFamily: 'System',
  },
  narcanChecklist: {
    gap: 4,
    paddingVertical: 6,
  },
  narcanRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  narcanDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: L.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  narcanDotDone: {
    backgroundColor: L.red,
  },
  narcanCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  narcanSubtitle: {
    fontSize: 15,
    color: L.textSecondary,
    fontFamily: 'System',
    marginBottom: 8,
  },
  narcanText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    color: L.textPrimary,
    fontFamily: 'System',
  },
  narcanTextDone: {
    color: L.textMuted,
  },
  cardActions: { gap: 10, marginTop: 8 },
  completeBtn: {
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: L.surfaceAlt,
    borderWidth: 1,
    borderColor: L.border,
    marginTop: 12,
  },
  completeBtnReady: {
    backgroundColor: L.red,
    borderColor: L.red,
    shadowColor: 'rgba(204,34,34,0.22)',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: L.textMuted,
    fontFamily: 'System',
  },
  completeBtnTextReady: {
    color: '#FFFFFF',
  },

  // Guidance
  guidanceScreen: {
    flex: 1,
    paddingTop: 12,
  },
  guidanceExitRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  guidanceExitButton: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    backgroundColor: L.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(204,34,34,0.22)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  guidanceExitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'System',
  },
  guidanceTop: {
    paddingHorizontal: 16,
    gap: 12,
  },
  guidanceHeading: { fontSize: 20, fontWeight: '700', color: L.textPrimary, fontFamily: 'System' },
  guidanceSub: { fontSize: 14, color: L.textSecondary, fontFamily: 'System', lineHeight: 20 },
  priorityCard: {
    padding: 16,
    backgroundColor: L.redSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(204,34,34,0.18)',
    gap: 6,
  },
  priorityTitle: { fontSize: 15, fontWeight: '700', color: L.red, marginBottom: 2 },
  priorityText: { fontSize: 15, fontWeight: '700', color: L.textPrimary },
  actionGrid: { flexDirection: 'row', gap: 8 },
  actionTile: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 8,
    backgroundColor: L.surface, borderRadius: 12,
    borderWidth: 1, borderColor: L.border,
    alignItems: 'center', gap: 6,
  },
  actionTilePrimary: { backgroundColor: L.red, borderColor: L.red },
  actionTileIcon: { fontSize: 18 },
  actionTileText: { fontSize: 12, fontWeight: '600', color: L.textSecondary, textAlign: 'center' },

  statusRow: {
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: L.greenSoft, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)',
  },
  statusRowText: { fontSize: 13, fontWeight: '600', color: L.green },
  dontCard: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: L.border,
    gap: 7,
  },
  dontTitle: { fontSize: 14, fontWeight: '700', color: L.textPrimary },
  dontText: { fontSize: 13, color: L.textSecondary, lineHeight: 18 },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: L.surface, borderRadius: 12,
    borderWidth: 1, borderColor: L.border,
  },
  linkRowIcon: { fontSize: 16 },
  linkRowText: { flex: 1, fontSize: 14, color: L.textPrimary, fontWeight: '500' },
  linkRowArrow: { fontSize: 18, color: L.textMuted },

  chatWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1, borderColor: L.border,
  },
  chatWrapExpanded: {
    marginTop: 0,
  },

  visionCard: {
    padding: 14, backgroundColor: 'rgba(59,130,246,0.06)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  visionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  visionTitle: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  visionClose: { fontSize: 14, color: L.textMuted },
  visionText: { fontSize: 14, color: L.textSecondary, lineHeight: 20 },

  endSession: {
    marginTop: 8, paddingVertical: 14, alignItems: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: L.border, backgroundColor: '#fff',
  },
  endSessionText: { fontSize: 14, fontWeight: '600', color: L.textSecondary },
})
