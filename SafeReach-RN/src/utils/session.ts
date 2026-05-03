import AsyncStorage from '@react-native-async-storage/async-storage'

const SESSION_TTL = 4 * 60 * 60 * 1000 // 4 hours

export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function storageKey(code: string) {
  return `sr_session_${code.toUpperCase()}`
}

export interface Location {
  lat: number
  lng: number
}

export interface FamilyMember {
  name: string
  location?: Location | null
  joinedAt: number
  lastSeen?: number
}

export interface VoiceMessage {
  audio: string
  from: string
  timestamp: number
  played: boolean
}

export interface FamilyMessage {
  from: string
  text: string
  timestamp: number
}

export interface Session {
  code: string
  victimName: string
  createdAt: number
  victimLocation: Location | null
  victimLastSeen: number
  familyMembers: FamilyMember[]
  chatHistory: Array<{ role: string; content: string; id?: string }>
  naloxoneGiven: boolean
  voiceMessages: VoiceMessage[]
  familyMessages: FamilyMessage[]
}

export async function createSession(code: string, victimName: string): Promise<Session> {
  const session: Session = {
    code: code.toUpperCase(),
    victimName: victimName || 'Unknown',
    createdAt: Date.now(),
    victimLocation: null,
    victimLastSeen: Date.now(),
    familyMembers: [],
    chatHistory: [],
    naloxoneGiven: false,
    voiceMessages: [],
    familyMessages: [],
  }
  await AsyncStorage.setItem(storageKey(code), JSON.stringify(session))
  return session
}

export async function getSession(code: string): Promise<Session | null> {
  if (!code) return null
  try {
    const raw = await AsyncStorage.getItem(storageKey(code))
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (Date.now() - session.createdAt > SESSION_TTL) {
      await AsyncStorage.removeItem(storageKey(code))
      return null
    }
    return session
  } catch {
    return null
  }
}

export async function updateSession(code: string, updates: Partial<Session>): Promise<Session | null> {
  const session = await getSession(code)
  if (!session) return null
  const updated = { ...session, ...updates }
  await AsyncStorage.setItem(storageKey(code), JSON.stringify(updated))
  return updated
}

export async function addFamilyMember(code: string, member: Omit<FamilyMember, 'joinedAt'>): Promise<Session | null> {
  const session = await getSession(code)
  if (!session) return null
  const existing = (session.familyMembers || []).findIndex(m => m.name === member.name)
  let members: FamilyMember[]
  if (existing >= 0) {
    members = session.familyMembers.map((m, i) => i === existing ? { ...m, ...member } : m)
  } else {
    members = [...(session.familyMembers || []), { ...member, joinedAt: Date.now() }]
  }
  return updateSession(code, { familyMembers: members })
}

export async function updateFamilyLocation(code: string, memberName: string, location: Location): Promise<Session | null> {
  const session = await getSession(code)
  if (!session) return null
  const members = (session.familyMembers || []).map(m =>
    m.name === memberName ? { ...m, location, lastSeen: Date.now() } : m
  )
  return updateSession(code, { familyMembers: members })
}

export async function addFamilyMessage(code: string, from: string, text: string): Promise<Session | null> {
  const session = await getSession(code)
  if (!session) return null
  const msgs = session.familyMessages || []
  return updateSession(code, {
    familyMessages: [...msgs, { from, text, timestamp: Date.now() }],
  })
}

export async function markVoicePlayed(code: string, timestamp: number): Promise<Session | null> {
  const session = await getSession(code)
  if (!session) return null
  const msgs = (session.voiceMessages || []).map(m =>
    m.timestamp === timestamp ? { ...m, played: true } : m
  )
  return updateSession(code, { voiceMessages: msgs })
}

// Haversine distance in miles
export function haversineDistance(a: Location, b: Location): number {
  const R = 3959
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function calculateETA(victimLoc: Location, familyLoc: Location) {
  const dist = haversineDistance(victimLoc, familyLoc)
  const eta = Math.max(1, Math.round(dist / 0.5))
  return { distance: dist.toFixed(1), eta }
}
