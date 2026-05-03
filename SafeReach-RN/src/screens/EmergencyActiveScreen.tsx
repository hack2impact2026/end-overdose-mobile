import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Share, Alert, Linking, Animated, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { useApp } from '../AppContext'
import ChatInterface from '../components/ChatInterface'
import { getSession, updateSession, calculateETA } from '../utils/session'
import { colors, radius, font } from '../theme'

function elapsed(secs: number) {
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

export default function EmergencyActiveScreen() {
  const {
    sessionCode, endEmergency, chatHistory, setChatHistory,
    naloxoneGiven, setNaloxoneGiven, userName, location, setLocation, visionResult,
  } = useApp()
  const insets = useSafeAreaInsets()

  const [secs, setSecs] = useState(0)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [alertShared, setAlertShared] = useState(false)
  const [showVision, setShowVision] = useState(!!visionResult)

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

      // Update location in session
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
    Alert.alert(
      'End Emergency?',
      'This will close your session and disconnect family members.',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'End Session', style: 'destructive',
          onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); endEmergency() }
        },
      ]
    )
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.activeDot} />
          <Text style={s.timerText}>{elapsed(secs)}</Text>
        </View>
        <Text style={s.sessionCode}>
          {sessionCode} {copied ? '✓' : ''}
        </Text>
        <TouchableOpacity style={s.endBtn} onPress={handleEndEmergency}>
          <Text style={s.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Family members */}
      {familyMembers.length > 0 && (
        <View style={s.familyBar}>
          <Text style={s.familyLabel}>On the way: </Text>
          {familyMembers.map((m, i) => (
            <View key={i} style={s.familyChip}>
              <Text style={s.familyChipText}>{m.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* GPS / share bar */}
      <View style={s.actionBar}>
        <TouchableOpacity style={[s.actionBtn, { flex: 1 }]} onPress={fetchGPS}>
          <Text style={s.actionBtnIcon}>📍</Text>
          <Text style={s.actionBtnText}>
            {gpsLoading ? 'Locating...' : location ? '✓ GPS Active' : 'Get Location'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.actionBtnRed, { flex: 1.4 }]} onPress={shareAlert}>
          <Text style={s.actionBtnIcon}>📤</Text>
          <Text style={[s.actionBtnText, { color: colors.white }]}>
            {alertShared ? '✓ Alert Sent' : 'Alert Contacts'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn]} onPress={copyCode}>
          <Text style={s.actionBtnText}>🔑 {copied ? 'Copied!' : sessionCode}</Text>
        </TouchableOpacity>
      </View>

      {/* Narcan toggle */}
      <TouchableOpacity
        style={[s.narcanRow, naloxoneGiven && s.narcanActive]}
        onPress={() => { setNaloxoneGiven(!naloxoneGiven); Haptics.selectionAsync() }}
      >
        <Text style={s.narcanIcon}>💊</Text>
        <Text style={[s.narcanText, naloxoneGiven && { color: colors.green }]}>
          {naloxoneGiven ? 'Naloxone given ✓' : 'Naloxone not given — tap when administered'}
        </Text>
      </TouchableOpacity>

      {/* Vision result */}
      {showVision && visionResult && (
        <View style={s.visionCard}>
          <View style={s.visionHeader}>
            <Text style={s.visionTitle}>📷 Scan Result</Text>
            <TouchableOpacity onPress={() => setShowVision(false)}>
              <Text style={s.visionClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.visionText}>{visionResult}</Text>
        </View>
      )}

      {/* Camera button */}
      <TouchableOpacity style={s.cameraRow} onPress={() => router.push('/camera')}>
        <Text style={s.cameraIcon}>📷</Text>
        <Text style={s.cameraText}>Scan for symptoms with AI vision</Text>
        <Text style={s.cameraArrow}>›</Text>
      </TouchableOpacity>

      {/* Chat */}
      <View style={{ flex: 1 }}>
        <ChatInterface />
      </View>

      {/* Call 911 */}
      <TouchableOpacity
        style={[s.callBtn, { marginBottom: insets.bottom + 8 }]}
        onPress={() => Linking.openURL('tel:911')}
      >
        <Text style={s.callBtnText}>📞 Call 911</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  timerText: { fontSize: font.xl, fontWeight: '800', color: colors.white, fontVariant: ['tabular-nums'] },
  sessionCode: { fontSize: font.sm, fontWeight: '700', color: colors.textMuted, letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  endBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(232,0,13,0.1)', borderRadius: radius.md, borderWidth: 1, borderColor: colors.redBorder },
  endBtnText: { fontSize: font.sm, fontWeight: '700', color: colors.red },
  familyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.greenDim, borderBottomWidth: 1, borderBottomColor: colors.greenBorder, flexWrap: 'wrap', gap: 6 },
  familyLabel: { fontSize: font.sm, color: colors.green, fontWeight: '600' },
  familyChip: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: colors.greenBorder },
  familyChipText: { fontSize: font.xs, fontWeight: '700', color: colors.green },
  actionBar: { flexDirection: 'row', gap: 6, padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  actionBtnRed: { backgroundColor: 'rgba(232,0,13,0.15)', borderColor: colors.redBorder },
  actionBtnIcon: { fontSize: 14 },
  actionBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  narcanRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginHorizontal: 10, marginTop: 8, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  narcanActive: { backgroundColor: colors.greenDim, borderColor: colors.greenBorder },
  narcanIcon: { fontSize: 16 },
  narcanText: { flex: 1, fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
  visionCard: { margin: 10, padding: 12, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  visionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  visionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.blue },
  visionClose: { fontSize: font.sm, color: colors.textMuted },
  visionText: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 20 },
  cameraRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 10, marginVertical: 4, padding: 10, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  cameraIcon: { fontSize: 16 },
  cameraText: { flex: 1, fontSize: font.sm, color: colors.textSecondary },
  cameraArrow: { fontSize: 18, color: colors.textMuted },
  callBtn: { marginHorizontal: 16, marginTop: 8, paddingVertical: 16, backgroundColor: colors.red, borderRadius: radius.xl, alignItems: 'center', shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  callBtnText: { fontSize: font.lg, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
})