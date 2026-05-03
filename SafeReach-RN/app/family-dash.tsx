import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Linking, ActivityIndicator,
} from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { useApp } from '../src/AppContext'
import {
  getSession, updateFamilyLocation, addFamilyMessage,
  calculateETA, Session,
} from '../src/utils/session'
import { colors, radius, font } from '../src/theme'

export default function FamilyDashScreen() {
  const { familyJoinCode: sessionCode, familyMemberName: memberName } = useApp()
  const insets = useSafeAreaInsets()
  const [session, setSession] = useState<Session | null>(null)
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [eta, setEta] = useState<{ distance: string; eta: number } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)
  const myLocRef = useRef<{ lat: number; lng: number } | null>(null)

  // Track own location
  useEffect(() => {
    let watchId: Location.LocationSubscription | null = null
    async function startWatch() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      watchId = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setMyLoc(loc)
          myLocRef.current = loc
          if (sessionCode) updateFamilyLocation(sessionCode, memberName, loc)
        }
      )
    }
    startWatch()
    return () => { watchId?.remove() }
  }, [sessionCode, memberName])

  // Poll session
  useEffect(() => {
    if (!sessionCode) return
    const tick = async () => {
      const s = await getSession(sessionCode)
      if (!s) { setNotFound(true); return }
      setSession(s)
      if (myLocRef.current) updateFamilyLocation(sessionCode, memberName, myLocRef.current)
      if (s.victimLocation && myLocRef.current) {
        setEta(calculateETA(s.victimLocation, myLocRef.current))
      }
    }
    tick()
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [sessionCode, memberName])

  async function sendMessage() {
    if (!msgText.trim() || !sessionCode) return
    setSending(true)
    await addFamilyMessage(sessionCode, memberName, msgText.trim())
    setMsgText('')
    setSending(false)
    setMsgSent(true)
    setTimeout(() => setMsgSent(false), 2000)
  }

  if (notFound) {
    return (
      <View style={[s.screen, s.center, { paddingTop: insets.top }]}>
        <Text style={s.notFoundIcon}>⚠️</Text>
        <Text style={s.notFoundTitle}>Session not found</Text>
        <Text style={s.notFoundSub}>The session may have ended or expired.</Text>
        <TouchableOpacity style={s.backHomeBtn} onPress={() => router.replace('/')}>
          <Text style={s.backHomeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!session) {
    return (
      <View style={[s.screen, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.red} />
        <Text style={s.loadingText}>Connecting to session...</Text>
      </View>
    )
  }

  const victimLoc = session.victimLocation
  const region = victimLoc ? {
    latitude: victimLoc.lat,
    longitude: victimLoc.lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  } : null

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.activeDot} />
          <Text style={s.headerTitle}>{session.victimName}</Text>
        </View>
        <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL('tel:911')}>
          <Text style={s.callBtnText}>📞 Call 911</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* ETA card */}
        {eta && (
          <View style={s.etaCard}>
            <Text style={s.etaIcon}>🚗</Text>
            <View>
              <Text style={s.etaText}>{eta.distance} miles away</Text>
              <Text style={s.etaSub}>~{eta.eta} min at current speed</Text>
            </View>
          </View>
        )}

        {/* Map */}
        {region ? (
          <View style={s.mapContainer}>
            <MapView
              style={s.map}
              region={region}
              provider={PROVIDER_DEFAULT}
              userInterfaceStyle="dark"
              showsUserLocation={!!myLoc}
            >
              <Marker
                coordinate={{ latitude: victimLoc!.lat, longitude: victimLoc!.lng }}
                title={session.victimName}
              >
                <View style={s.victimMarker}>
                  <Text style={s.victimMarkerText}>🆘</Text>
                </View>
              </Marker>
              {myLoc && (
                <Marker
                  coordinate={{ latitude: myLoc.lat, longitude: myLoc.lng }}
                  title="You"
                >
                  <View style={s.myMarker}>
                    <Text style={s.myMarkerText}>👤</Text>
                  </View>
                </Marker>
              )}
            </MapView>
            <View style={s.mapLegend}>
              <Text style={s.mapLegendText}>🆘 {session.victimName}   👤 You</Text>
            </View>
          </View>
        ) : (
          <View style={s.noLocationCard}>
            <Text style={s.noLocationIcon}>📍</Text>
            <Text style={s.noLocationText}>Waiting for victim's location...</Text>
          </View>
        )}

        {/* Status info */}
        <View style={s.statusCard}>
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Naloxone given</Text>
            <Text style={[s.statusValue, session.naloxoneGiven && { color: colors.green }]}>
              {session.naloxoneGiven ? '✓ Yes' : 'Not yet'}
            </Text>
          </View>
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Session code</Text>
            <Text style={[s.statusValue, { fontFamily: 'monospace', letterSpacing: 2 }]}>{sessionCode}</Text>
          </View>
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Helpers in session</Text>
            <Text style={s.statusValue}>{session.familyMembers?.length || 0}</Text>
          </View>
        </View>

        {/* Messages from victim */}
        {(session.familyMessages || []).length > 0 && (
          <View style={s.messagesSection}>
            <Text style={s.messagesLabel}>MESSAGES</Text>
            {session.familyMessages.map((m, i) => (
              <View key={i} style={s.messageBubble}>
                <Text style={s.messageMeta}>{m.from}</Text>
                <Text style={s.messageText}>{m.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Send a message */}
        <View style={s.sendMsgSection}>
          <Text style={s.sendMsgLabel}>MESSAGE TO {session.victimName?.toUpperCase()}</Text>
          <View style={s.sendMsgRow}>
            <TextInput
              style={s.sendMsgInput}
              value={msgText}
              onChangeText={setMsgText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[s.sendBtn, !msgText.trim() && s.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!msgText.trim() || sending}
            >
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendBtnText}>↑</Text>}
            </TouchableOpacity>
          </View>
          {msgSent && <Text style={s.msgSentText}>✓ Message sent</Text>}
        </View>

        {/* Directions button */}
        {victimLoc && (
          <TouchableOpacity
            style={s.directionsBtn}
            onPress={() => Linking.openURL(`https://maps.apple.com/?daddr=${victimLoc.lat},${victimLoc.lng}&dirflg=d`)}
          >
            <Text style={s.directionsBtnText}>🗺  Get Directions to {session.victimName}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.red },
  headerTitle: { fontSize: font.lg, fontWeight: '700', color: colors.white },
  callBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(232,0,13,0.15)', borderRadius: radius.md, borderWidth: 1, borderColor: colors.redBorder },
  callBtnText: { fontSize: font.sm, fontWeight: '700', color: colors.red },
  body: { padding: 14, gap: 14, paddingBottom: 40 },
  etaCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  etaIcon: { fontSize: 24 },
  etaText: { fontSize: font.lg, fontWeight: '700', color: colors.white },
  etaSub: { fontSize: font.sm, color: colors.textMuted },
  mapContainer: { borderRadius: radius.xl, overflow: 'hidden', height: 240 },
  map: { flex: 1 },
  mapLegend: { position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.md, padding: 6, alignItems: 'center' },
  mapLegendText: { color: '#fff', fontSize: font.xs },
  victimMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  victimMarkerText: { fontSize: 18 },
  myMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  myMarkerText: { fontSize: 16 },
  noLocationCard: { padding: 30, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 8 },
  noLocationIcon: { fontSize: 32 },
  noLocationText: { color: colors.textMuted, fontSize: font.sm },
  statusCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  statusLabel: { fontSize: font.sm, color: colors.textSecondary },
  statusValue: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },
  messagesSection: { gap: 8 },
  messagesLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  messageBubble: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  messageMeta: { fontSize: font.xs, color: colors.textMuted, marginBottom: 4 },
  messageText: { fontSize: font.sm, color: colors.textSecondary },
  sendMsgSection: { gap: 8 },
  sendMsgLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  sendMsgRow: { flexDirection: 'row', gap: 8 },
  sendMsgInput: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: font.sm, color: colors.white, maxHeight: 80 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 18, color: '#fff', fontWeight: '800' },
  msgSentText: { fontSize: font.xs, color: colors.green },
  directionsBtn: { paddingVertical: 14, backgroundColor: colors.blue, borderRadius: radius.xl, alignItems: 'center' },
  directionsBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
  notFoundIcon: { fontSize: 40 },
  notFoundTitle: { fontSize: font.xl, fontWeight: '700', color: colors.white },
  notFoundSub: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center' },
  backHomeBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.red, borderRadius: radius.md },
  backHomeBtnText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },
  loadingText: { color: colors.textSecondary, fontSize: font.sm },
})
