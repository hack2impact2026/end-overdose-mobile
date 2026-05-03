import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { useApp } from '../src/AppContext'
import { getSession, addFamilyMember } from '../src/utils/session'
import { colors, radius, font } from '../src/theme'

export default function FamilyJoinScreen() {
  const { setFamilyJoinCode, setFamilyMemberName } = useApp()
  const insets = useSafeAreaInsets()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isReady = code.length === 6 && name.trim().length > 0

  async function handleJoin() {
    if (!isReady || loading) return
    setLoading(true)
    setError(null)

    const session = await getSession(code)
    if (!session) {
      setError('Session not found. Check the code and try again.')
      setLoading(false)
      return
    }

    let loc = null
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      }
    } catch {}

    await addFamilyMember(code, { name: name.trim(), location: loc })
    setFamilyJoinCode(code)
    setFamilyMemberName(name.trim())
    setLoading(false)
    router.replace('/family-dash')
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[s.screen, { paddingTop: insets.top }]}
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Join Emergency Session</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Alert badge */}
        <View style={s.alertBadge}>
          <Text style={s.alertBadgeText}>⚠️  EMERGENCY SESSION</Text>
        </View>

        <Text style={s.title}>Enter Session Code</Text>
        <Text style={s.subtitle}>Enter the 6-character code shared with you</Text>

        {/* Code input */}
        <TextInput
          style={s.codeInput}
          value={code}
          onChangeText={v => { setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); setError(null) }}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="ABC123"
          placeholderTextColor={colors.textMuted}
          keyboardType="default"
          returnKeyType="next"
        />

        {/* Name */}
        <View style={s.nameSection}>
          <Text style={s.nameLabel}>YOUR NAME</Text>
          <TextInput
            style={s.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Mom, Alex, Jordan"
            placeholderTextColor={colors.textMuted}
            returnKeyType="go"
            onSubmitEditing={handleJoin}
          />
          <Text style={s.nameHint}>Shown on the victim's screen when you join</Text>
        </View>

        {error && (
          <View style={s.errorCard}>
            <Text style={s.errorText}>⚠️  {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.joinBtn, (!isReady || loading) && s.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={!isReady || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.joinBtnText}>Join Session →</Text>}
        </TouchableOpacity>

        <Text style={s.disclaimer}>By joining, you consent to sharing your location with this session.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  backBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 24, color: '#fff', fontWeight: '300', lineHeight: 28 },
  headerTitle: { fontSize: font.lg, fontWeight: '700', color: colors.white },
  body: { padding: 24, paddingTop: 12, gap: 20, alignItems: 'center' },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(232,0,13,0.1)', borderWidth: 1, borderColor: colors.redBorder, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 8 },
  alertBadgeText: { fontSize: font.xs, fontWeight: '800', color: colors.red, letterSpacing: 1.5 },
  title: { fontSize: font['3xl'], fontWeight: '800', color: colors.white, textAlign: 'center' },
  subtitle: { fontSize: font.md, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  codeInput: {
    width: '100%', backgroundColor: '#161616',
    borderWidth: 1.5, borderColor: colors.border2,
    borderRadius: radius.lg, padding: 16,
    fontSize: 28, fontWeight: '800', color: colors.white,
    textAlign: 'center', letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  nameSection: { width: '100%', gap: 6 },
  nameLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  nameInput: { width: '100%', backgroundColor: '#161616', borderWidth: 1, borderColor: colors.border2, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: font.lg, color: colors.white },
  nameHint: { fontSize: 11, color: colors.textMuted },
  errorCard: { width: '100%', backgroundColor: 'rgba(232,0,13,0.08)', borderWidth: 1, borderColor: colors.redBorder, borderRadius: radius.md, padding: 12 },
  errorText: { fontSize: font.sm, color: colors.red },
  joinBtn: { width: '100%', minHeight: 58, backgroundColor: colors.red, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', shadowColor: colors.red, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  joinBtnDisabled: { opacity: 0.4 },
  joinBtnText: { fontSize: font.lg, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  disclaimer: { fontSize: 11, color: colors.textDim, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
})