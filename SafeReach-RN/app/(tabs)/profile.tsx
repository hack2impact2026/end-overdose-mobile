import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../../src/AppContext'
import { colors, radius, font } from '../../src/theme'

const INFO_ROWS = [
  ['Version', '1.0.0'],
  ['AI Model', 'claude-haiku-4-5'],
  ['Session storage', 'Device only'],
  ['Location access', 'On demand only'],
]

export default function ProfileScreen() {
  const { userName, saveUserName } = useApp()
  const insets = useSafeAreaInsets()
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(userName)
  const [saved, setSaved] = useState(false)

  function save() {
    saveUserName(nameInput.trim())
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initials = userName
    ? userName.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Avatar card */}
        <View style={s.avatarCard}>
          <View style={s.bigAvatar}>
            <Text style={s.bigAvatarText}>{initials}</Text>
          </View>
          <Text style={s.nameDisplay}>{userName || 'Set your name'}</Text>
          <Text style={s.nameSub}>Used in emergency alerts sent to your contacts</Text>
        </View>

        {/* Identity section */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>IDENTITY</Text>
          <View style={s.card}>
            <Text style={s.cardLabel}>Your name</Text>
            {editing ? (
              <View style={s.editRow}>
                <TextInput
                  style={s.input}
                  value={nameInput}
                  onChangeText={setNameInput}
                  onSubmitEditing={save}
                  autoFocus
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                />
                <TouchableOpacity style={s.saveBtn} onPress={save}>
                  <Text style={s.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.editTrigger} onPress={() => { setNameInput(userName); setEditing(true) }}>
                <Text style={{ color: userName ? colors.white : colors.textMuted, fontSize: font.md }}>
                  {userName || 'Not set'}
                </Text>
                <Text style={s.editIcon}>✎</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* About section */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ABOUT</Text>
          <View style={s.infoCard}>
            {INFO_ROWS.map(([label, value], i) => (
              <View key={label} style={[s.infoRow, i < INFO_ROWS.length - 1 && s.infoRowBorder]}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={s.disclaimerCard}>
          <Text style={s.disclaimerTitle}>⚠️ Medical Disclaimer</Text>
          <Text style={s.disclaimerText}>
            SafeReach is not a substitute for emergency medical services. Always call 911 in any life-threatening situation.
            AI responses are for guidance only and do not constitute medical advice.
          </Text>
        </View>

        {saved && (
          <View style={s.savedBanner}>
            <Text style={s.savedBannerText}>✓ Profile saved</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.white },
  body: { padding: 16, gap: 20, paddingBottom: 40 },
  avatarCard: { alignItems: 'center', gap: 8, padding: 24, backgroundColor: colors.bgCard, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(232,0,13,0.2)', borderWidth: 2, borderColor: colors.redBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bigAvatarText: { fontSize: 28, fontWeight: '800', color: colors.red },
  nameDisplay: { fontSize: font.xl, fontWeight: '700', color: colors.white },
  nameSub: { fontSize: font.xs, color: colors.textMuted, textAlign: 'center', maxWidth: 200 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  cardLabel: { fontSize: font.xs, color: colors.textMuted, fontWeight: '600' },
  editRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#222', borderWidth: 1, borderColor: colors.border2, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 9, fontSize: font.md, color: colors.white },
  saveBtn: { backgroundColor: colors.red, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 9 },
  saveBtnText: { color: '#fff', fontSize: font.sm, fontWeight: '600' },
  editTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editIcon: { color: colors.textMuted, fontSize: font.md },
  infoCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  infoLabel: { fontSize: font.sm, color: colors.textSecondary },
  infoValue: { fontSize: font.sm, color: colors.textMuted, maxWidth: '55%', textAlign: 'right' },
  disclaimerCard: { backgroundColor: 'rgba(232,0,13,0.06)', borderWidth: 1, borderColor: colors.redBorder, borderRadius: radius.lg, padding: 14 },
  disclaimerTitle: { fontSize: font.sm, fontWeight: '700', color: colors.red, marginBottom: 6 },
  disclaimerText: { fontSize: font.xs, color: colors.textSecondary, lineHeight: 20 },
  savedBanner: { backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.greenBorder, borderRadius: radius.md, padding: 10, alignItems: 'center' },
  savedBannerText: { color: colors.green, fontSize: font.sm, fontWeight: '600' },
})
