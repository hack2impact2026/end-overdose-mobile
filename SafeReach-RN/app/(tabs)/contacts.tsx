import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Linking, Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, font } from '../../src/theme'

const STORE_KEY = 'sr_contacts'

interface Contact {
  id: number
  name: string
  phone: string
  relation: string
}

async function loadContacts(): Promise<Contact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

async function saveContacts(list: Contact[]) {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(list))
}

export default function ContactsScreen() {
  const insets = useSafeAreaInsets()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loaded, setLoaded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', relation: '' })

  if (!loaded) {
    loadContacts().then(c => { setContacts(c); setLoaded(true) })
    return null
  }

  async function addContact() {
    if (!form.name.trim()) return
    const updated = [...contacts, { ...form, id: Date.now() }]
    setContacts(updated)
    await saveContacts(updated)
    setForm({ name: '', phone: '', relation: '' })
    setAdding(false)
  }

  async function removeContact(id: number) {
    Alert.alert('Remove Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = contacts.filter(c => c.id !== id)
          setContacts(updated)
          await saveContacts(updated)
        }
      }
    ])
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Emergency Contacts</Text>
        <Text style={s.sub}>Alerted when you press SOS</Text>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={s.list}
        ListEmptyComponent={!adding ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyText}>No contacts yet</Text>
            <Text style={s.emptySub}>Add family and friends who should be notified in an emergency</Text>
          </View>
        ) : null}
        ListFooterComponent={
          adding ? (
            <View style={s.formCard}>
              <TextInput style={s.input} placeholder="Name *" placeholderTextColor={colors.textMuted}
                value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} autoFocus />
              <TextInput style={s.input} placeholder="Phone number" placeholderTextColor={colors.textMuted}
                value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" />
              <TextInput style={s.input} placeholder="Relation (e.g. Mom, Partner)" placeholderTextColor={colors.textMuted}
                value={form.relation} onChangeText={v => setForm(f => ({ ...f, relation: v }))} />
              <View style={s.formBtns}>
                <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setAdding(false)}>
                  <Text style={s.btnGhostText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.btnPrimary, { flex: 2 }]} onPress={addContact}>
                  <Text style={s.btnPrimaryText}>Save Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.addBtn} onPress={() => setAdding(true)}>
              <Text style={s.addBtnText}>＋  Add Contact</Text>
            </TouchableOpacity>
          )
        }
        renderItem={({ item: c }) => (
          <View style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{c.name[0].toUpperCase()}</Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardName}>{c.name}</Text>
              <Text style={s.cardMeta}>{c.relation ? `${c.relation} · ` : ''}{c.phone}</Text>
            </View>
            {c.phone ? (
              <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                <Text style={s.callBtnText}>📞</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={s.removeBtn} onPress={() => removeContact(c.id)}>
              <Text style={s.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.white, marginBottom: 4 },
  sub: { fontSize: font.sm, color: colors.textMuted },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyText: { fontSize: font.lg, fontWeight: '600', color: colors.textSecondary },
  emptySub: { fontSize: font.sm, color: colors.textMuted, lineHeight: 20, textAlign: 'center' },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.redDim, borderWidth: 1, borderColor: colors.redBorder, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: colors.red },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: font.md, fontWeight: '600', color: colors.white, marginBottom: 2 },
  cardMeta: { fontSize: font.xs, color: colors.textMuted },
  callBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.greenBorder, alignItems: 'center', justifyContent: 'center' },
  callBtnText: { fontSize: 16 },
  removeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 12, color: colors.textMuted },
  formCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border2, gap: 10 },
  input: { backgroundColor: '#222', borderWidth: 1, borderColor: colors.border2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: font.md, color: colors.white },
  formBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btn: { borderRadius: radius.md, padding: 12, flex: 1, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.red },
  btnPrimaryText: { color: '#fff', fontSize: font.sm, fontWeight: '600' },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border2 },
  btnGhostText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  addBtn: { alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderRadius: radius.lg, borderStyle: 'dashed' },
  addBtnText: { fontSize: font.md, fontWeight: '600', color: colors.textSecondary },
})
