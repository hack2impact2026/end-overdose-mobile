import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Share, Linking, Platform, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { useApp } from '../AppContext'
import ChatInterface from '../components/ChatInterface'
import EmergencyBackButton from '../components/EmergencyBackButton'
import { getSession, updateSession, calculateETA } from '../utils/session'
import { lightColors as L } from '../theme'

const CHECK_RESPONSE_IMAGE = require('../../assets/emergency-hero.png')

type Step = 1 | 2 | 3 | 'guidance'

const STEPS: { n: 1 | 2 | 3; key: string; label: string }[] = [
  { n: 1, key: 'check', label: 'Check' },
  { n: 2, key: 'act', label: 'Act' },
  { n: 3, key: 'stay', label: 'Stay' },
]

const STAY_ACTIONS = [
  'Keep them on their side',
  'Watch breathing',
  'Do not leave',
]

const DONT_ACTIONS = [
  'Do not let them sleep it off',
  'Do not put them in a cold shower',
  'Do not give food, drink, alcohol, or stimulants',
  'Do not leave because they woke up',
]

function elapsed(secs: number) {
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

export default function EmergencyActiveScreen() {
  const {
    sessionCode, endEmergency, chatHistory, setChatHistory,
    naloxoneGiven, setNaloxoneGiven, userName, location, setLocation, visionResult,
  } = useApp()
  const insets = useSafeAreaInsets()

  const [introVisible, setIntroVisible] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [secs, setSecs] = useState(0)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [alertShared, setAlertShared] = useState(false)
  const [showVision, setShowVision] = useState(!!visionResult)
  const [chatOpen, setChatOpen] = useState(true)
  const [naloxoneAt, setNaloxoneAt] = useState<number | null>(null)

  const locationRef = useRef(location)
  const chatHistoryRef = useRef(chatHistory)
  const naloxoneRef = useRef(naloxoneGiven)
  const prevFamilyCount = useRef(0)

  useEffect(() => { locationRef.current = location }, [location])
  useEffect(() => { chatHistoryRef.current = chatHistory }, [chatHistory])
  useEffect(() => { naloxoneRef.current = naloxoneGiven }, [naloxoneGiven])
  useEffect(() => { if (visionResult) setShowVision(true) }, [visionResult])

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

  async function copyCode() {
    if (!sessionCode) return
    await Clipboard.setStringAsync(sessionCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleEndEmergency() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    endEmergency()
  }

  function advance(next: Step) {
    Haptics.selectionAsync()
    setStep(next)
  }

  function handleStepBack() {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
    // step 1 and guidance: back button visible but tap is no-op (hold exits)
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
              secs={secs}
              naloxoneAt={naloxoneAt}
              onAdvance={advance}
              onCall911={call911}
              onNaloxoneYes={() => { setNaloxoneGiven(true); setNaloxoneAt(secs); advance(3) }}
            />
            <StepBottomControls
              current={step}
              bottom={insets.bottom + 24}
              onBack={handleStepBack}
              onNext={() => {
                if (step === 1) advance(2)
                else if (step === 2) advance(3)
                else advance('guidance')
              }}
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
          copied={copied}
          sessionCode={sessionCode}
          onCopyCode={copyCode}
          naloxoneGiven={naloxoneGiven}
          naloxoneElapsedSecs={naloxoneAt === null ? null : secs - naloxoneAt}
          onCamera={() => router.push('/camera')}
          showVision={showVision}
          visionResult={visionResult}
          onCloseVision={() => setShowVision(false)}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen(o => !o)}
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
        <Text style={s.introIcon}>🚑</Text>
        <Text style={s.introTitle}>Take a deep breath{'\n'}EMS is on the way</Text>
        <View style={s.introActions}>
          <TouchableOpacity style={s.introButton} onPress={onNeedHelp} activeOpacity={0.86}>
            <Text style={s.introButtonText}>I NEED HELP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.introButton} onPress={onReadyToHelp} activeOpacity={0.86}>
            <Text style={s.introButtonText}>I'M READY TO HELP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  onNext,
}: {
  current: 1 | 2 | 3
  bottom: number
  onBack: () => void
  onNext: () => void
}) {
  return (
    <View style={[s.bottomControls, { bottom }]}>
      {current === 1 ? (
        <View style={s.stepBackPlaceholder} />
      ) : (
        <TouchableOpacity
          style={s.stepBackCircle}
          onPress={onBack}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Previous step"
        >
          <Text style={s.stepBackChevron}>‹</Text>
        </TouchableOpacity>
      )}
      <View style={s.bottomCheckpoints}>
        <StepPill current={current} />
      </View>
      <TouchableOpacity
        style={s.nextCircle}
        onPress={onNext}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Next step"
      >
        <Text style={s.nextChevron}>›</Text>
      </TouchableOpacity>
    </View>
  )
}

interface StepCardProps {
  step: 1 | 2 | 3
  secs: number
  naloxoneAt: number | null
  onAdvance: (next: Step) => void
  onCall911: () => void
  onNaloxoneYes: () => void
}

function StepCard({ step, secs, naloxoneAt, onAdvance, onCall911, onNaloxoneYes }: StepCardProps) {
  if (step === 1) {
    return (
      <View style={s.stepCanvas}>
        <Text style={s.stepTitle}>Is this an Overdose?</Text>
        <Image
          source={CHECK_RESPONSE_IMAGE}
          style={s.stepImage}
          resizeMode="contain"
        />
        <View style={s.checklist}>
          <Text style={s.checklistTitle}>Check them now</Text>
          <Text style={s.checklistItem}>Tap their shoulders.</Text>
          <Text style={s.checklistItem}>Shout their name.</Text>
          <Text style={s.checklistItem}>Look for slow or no breathing.</Text>
        </View>
        <View style={s.responseChoices}>
          <TouchableOpacity style={s.responseChoice} onPress={() => onAdvance('guidance')} activeOpacity={0.78}>
            <Text style={s.responseChoiceText}>Awake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.responseChoice} onPress={() => onAdvance(2)} activeOpacity={0.78}>
            <Text style={s.responseChoiceText}>Barely responsive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.responseChoice, s.responseChoiceUrgent]} onPress={() => onAdvance(2)} activeOpacity={0.82}>
            <Text style={[s.responseChoiceText, s.responseChoiceUrgentText]}>Unresponsive</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  if (step === 2) {
    return (
      <View style={s.card}>
        <Text style={s.cardEyebrow}>Step 2 of 3</Text>
        <Text style={s.cardTitle}>Call 911. Give naloxone.</Text>
        <Text style={s.cardBody}>Naloxone is safe to use if you suspect an opioid overdose.</Text>
        <View style={s.actionChecklist}>
          <Text style={s.checkItem}>1. Call 911 now</Text>
          <Text style={s.checkItem}>2. Lay them on their back briefly</Text>
          <Text style={s.checkItem}>3. Spray into one nostril and press fully</Text>
          <Text style={s.checkItem}>4. Put them on their side once breathing is supported</Text>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity style={[s.btn, s.btnEmergency]} onPress={onCall911} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>CALL 911</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onNaloxoneYes} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>I gave naloxone</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => onAdvance(3)} activeOpacity={0.7}>
            <Text style={s.btnSecondaryText}>No naloxone available</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  const naloxoneElapsedSecs = naloxoneAt === null ? null : secs - naloxoneAt
  return (
    <View style={s.card}>
      <Text style={s.cardEyebrow}>Step 3 of 3</Text>
      <Text style={s.cardTitle}>Keep airway safe</Text>
      <Text style={s.cardBody}>
        {naloxoneElapsedSecs === null
          ? 'Place them on their side. Keep watching breathing.'
          : `${elapsed(naloxoneElapsedSecs)} since naloxone. If no response after 2-3 minutes, give another dose if available.`}
      </Text>
      <View style={s.actionChecklist}>
        {STAY_ACTIONS.map(action => (
          <Text key={action} style={s.checkItem}>{action}</Text>
        ))}
      </View>
      <View style={s.cardActions}>
        <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onNaloxoneYes} activeOpacity={0.85}>
          <Text style={s.btnPrimaryText}>Gave another dose</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => onAdvance('guidance')} activeOpacity={0.7}>
          <Text style={s.btnSecondaryText}>Continue to resources & AI guide</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

interface MorePanelProps {
  gpsLoading: boolean
  location: { lat: number; lng: number } | null
  onGetLocation: () => void
  alertShared: boolean
  onAlertContacts: () => void
  copied: boolean
  sessionCode: string | null
  onCopyCode: () => void
  naloxoneGiven: boolean
  naloxoneElapsedSecs: number | null
  onCamera: () => void
  showVision: boolean
  visionResult: string | null
  onCloseVision: () => void
  chatOpen: boolean
  onToggleChat: () => void
  onEnd: () => void
  bottomInset: number
}

function MoreGuidancePanel(p: MorePanelProps) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.guidanceHeading}>Resources & AI guide</Text>
        <Text style={s.guidanceSub}>The 3 emergency steps are complete. Keep them on their side, watch breathing, and use the guides or assistant below while help is on the way.</Text>

        <View style={s.priorityCard}>
          <Text style={s.priorityTitle}>Emergency guide</Text>
          <Text style={s.priorityText}>1. Call 911</Text>
          <Text style={s.priorityText}>2. Give naloxone</Text>
          <Text style={s.priorityText}>3. Keep them breathing</Text>
        </View>

        <View style={s.actionGrid}>
          <TouchableOpacity style={s.actionTile} onPress={p.onGetLocation} activeOpacity={0.7}>
            <Text style={s.actionTileIcon}>📍</Text>
            <Text style={s.actionTileText}>
              {p.gpsLoading ? 'Locating…' : p.location ? 'GPS active' : 'Get location'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionTile, s.actionTilePrimary]} onPress={p.onAlertContacts} activeOpacity={0.85}>
            <Text style={s.actionTileIcon}>📤</Text>
            <Text style={[s.actionTileText, { color: '#fff' }]}>
              {p.alertShared ? 'Alert sent' : 'Alert contacts'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionTile} onPress={p.onCopyCode} activeOpacity={0.7}>
            <Text style={s.actionTileIcon}>🔑</Text>
            <Text style={s.actionTileText}>{p.copied ? 'Copied!' : p.sessionCode}</Text>
          </TouchableOpacity>
        </View>

        {p.naloxoneGiven && (
          <View style={s.statusRow}>
            <Text style={s.statusRowText}>
              Naloxone given{p.naloxoneElapsedSecs === null ? '' : ` - ${elapsed(p.naloxoneElapsedSecs)} ago`}
            </Text>
          </View>
        )}

        <View style={s.dontCard}>
          <Text style={s.dontTitle}>Do not</Text>
          {DONT_ACTIONS.map(action => (
            <Text key={action} style={s.dontText}>{action}</Text>
          ))}
        </View>

        <TouchableOpacity style={s.linkRow} onPress={p.onCamera} activeOpacity={0.7}>
          <Text style={s.linkRowIcon}>📷</Text>
          <Text style={s.linkRowText}>Scan for symptoms with AI vision</Text>
          <Text style={s.linkRowArrow}>›</Text>
        </TouchableOpacity>

        {p.showVision && p.visionResult && (
          <View style={s.visionCard}>
            <View style={s.visionHeader}>
              <Text style={s.visionTitle}>Scan result</Text>
              <TouchableOpacity onPress={p.onCloseVision}><Text style={s.visionClose}>✕</Text></TouchableOpacity>
            </View>
            <Text style={s.visionText}>{p.visionResult}</Text>
          </View>
        )}

        <TouchableOpacity style={s.linkRow} onPress={p.onToggleChat} activeOpacity={0.7}>
          <Text style={s.linkRowIcon}>💬</Text>
          <Text style={s.linkRowText}>{p.chatOpen ? 'Hide AI guide' : 'Open AI guide'}</Text>
          <Text style={s.linkRowArrow}>{p.chatOpen ? '⌄' : '›'}</Text>
        </TouchableOpacity>

        {p.chatOpen && (
          <View style={s.chatWrap}>
            <ChatInterface />
          </View>
        )}

        <TouchableOpacity style={s.endSession} onPress={p.onEnd} activeOpacity={0.7}>
          <Text style={s.endSessionText}>End session</Text>
        </TouchableOpacity>
      </ScrollView>
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
  introButtonText: {
    color: '#EF0026',
    fontSize: 19,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0,
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
    fontSize: 12, fontWeight: '600', color: L.textMuted, letterSpacing: 1.5,
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
  stepArea: { flex: 1, paddingHorizontal: 32, paddingTop: 116, paddingBottom: 112 },
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
    justifyContent: 'space-between',
  },
  stepBackPlaceholder: {
    width: 58,
    height: 58,
  },
  stepBackCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(204,34,34,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(204,34,34,0.16)',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  stepBackChevron: {
    color: L.red,
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
  nextCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F8C9CD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(204,34,34,0.18)',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  nextChevron: {
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 42,
    fontWeight: '300',
    fontFamily: 'System',
    marginTop: -3,
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
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: L.textPrimary,
    fontFamily: 'System',
    marginBottom: 22,
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
  responseChoiceUrgent: {
    borderColor: 'rgba(204,34,34,0.28)',
    backgroundColor: L.redSoft,
  },
  responseChoiceText: {
    fontSize: 18,
    fontWeight: '600',
    color: L.textPrimary,
    fontFamily: 'System',
  },
  responseChoiceUrgentText: {
    color: L.red,
  },
  actionChecklist: {
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: L.border,
  },
  checkItem: { fontSize: 14, color: L.textPrimary, lineHeight: 20, fontWeight: '500' },
  cardActions: { gap: 10, marginTop: 8 },

  btn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnEmergency: { backgroundColor: '#111111' },
  btnPrimary: { backgroundColor: L.red },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: L.border },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: L.textSecondary },

  // Guidance
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
    height: 420,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1, borderColor: L.border,
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
