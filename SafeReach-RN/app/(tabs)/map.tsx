import { useState, useEffect, useRef, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Pressable, ActivityIndicator, Linking,
} from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import * as Location from 'expo-location'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../../src/AppContext'
import { lightColors as L } from '../../src/theme'
import Svg, { Path, Circle } from 'react-native-svg'
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';

// ── types ──────────────────────────────────────────────────────────────────

interface Place {
  id: string
  name: string
  lat: number
  lng: number
  type: string
  icon: string
  markerColor: string
  dist?: string
}

interface SOSPerson {
  id: string
  firstName: string
  lat: number
  lng: number
  resourceNeeded: 'naloxone' | 'hospital' | 'counseling'
  volunteersYes: number
  volunteerLocation?: string
  dist?: string
}

// ── constants ──────────────────────────────────────────────────────────────

const NARCAN_PURPLE = '#8B5CF6'
const NARCAN_ICON = '💊'
const UCLA_CENTER = { lat: 34.0709, lng: -118.444 }
const VOLUNTEER_DEFAULT_LOCATION = { lat: 34.0744166667, lng: -118.4391666667, label: '34° 04′ 27.9″ N, 118° 26′ 21.0″ W' }
const USER_DEFAULT_LOCATION = { lat: 34.069629, lng: -118.449129 }

const PLACE_TYPES = [
  { id: 'ucla_narcan', name: 'UCLA Narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE, query: null },
  { id: 'naloxone',  name: 'Naloxone',     icon: '💉', markerColor: NARCAN_PURPLE, query: 'pharmacy' },
  { id: 'urgent',    name: 'Urgent Care',  icon: '🩺', markerColor: '#2563EB', query: 'urgent care' },
  { id: 'hospital',  name: 'Hospital',     icon: '🏥', markerColor: '#CC2222', query: 'hospital' },
  { id: 'pharmacy',  name: 'Pharmacy',     icon: '🏪', markerColor: '#D97706', query: 'pharmacy' }
]

const UCLA_NARCAN_SITES: Omit<Place, 'dist'>[] = [
  { id: 'uclan_0', name: 'Arthur Ashe Student Health & Wellness Center', lat: 34.0699, lng: -118.4449, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_1', name: 'Office of Fraternity & Sorority Life (109 Kerckhoff)', lat: 34.0706, lng: -118.4441, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_2', name: 'CARE & Case Management Services (205 Covel Commons)', lat: 34.0752, lng: -118.4491, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_3', name: 'Transfer Student Center (128 Kerckhoff Hall)', lat: 34.0706, lng: -118.4442, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_4', name: 'Student Wellness Commission Peer Support Lounge (308 Kerckhoff)', lat: 34.0707, lng: -118.444, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_5', name: 'Bruin Resource Center (SAC B44)', lat: 34.071, lng: -118.4454, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_6', name: 'Financial Wellness (106 Strathmore)', lat: 34.0659, lng: -118.4428, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_7', name: 'Fielding School of Public Health (Floor 1, Corridor 6)', lat: 34.0697, lng: -118.4418, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_8', name: 'Debt Management Services (Murphy Hall A227)', lat: 34.0718, lng: -118.4397, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_9', name: 'LGBTQ+ Campus Resource Center (SAC B36)', lat: 34.0711, lng: -118.4455, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_10', name: 'RISE Center (Lu Valle Commons Basement)', lat: 34.0688, lng: -118.4426, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_11', name: 'Latinx Success Center (De Neve B1 Lounge)', lat: 34.0731, lng: -118.4484, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_12', name: 'School of Theater, Film & Television (East Melnitz 103)', lat: 34.0736, lng: -118.4413, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_13', name: 'UCLA Dept of Art (Broad Art Center, 2nd Floor Lobby)', lat: 34.0757, lng: -118.4393, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_14', name: 'John Wooden Center (221 Westwood Plaza)', lat: 34.072, lng: -118.4466, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_15', name: 'Bruin Fitness Center (251 Charles E Young Dr)', lat: 34.0714, lng: -118.4472, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_16', name: 'Kinross Recreation Center (11100 Kinross Ave)', lat: 34.0589, lng: -118.4482, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_17', name: 'Student Activities Center (220 Westwood Plaza)', lat: 34.071, lng: -118.4453, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_18', name: 'Dykstra/De Neve Front Desk (Dykstra Hall)', lat: 34.0726, lng: -118.449, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_19', name: 'Hedrick Court Front Desk (Hedrick Hall)', lat: 34.0742, lng: -118.4477, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_20', name: 'Rieber Court Front Desk (Rieber Hall)', lat: 34.0733, lng: -118.4462, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_21', name: 'Sproul Court Front Desk (Sproul Hall)', lat: 34.0741, lng: -118.4494, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_22', name: 'University Apartments North Front Desk', lat: 34.064, lng: -118.4411, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_23', name: 'University Apartments South (UAS) RA Office', lat: 34.0621, lng: -118.444, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
  { id: 'uclan_24', name: 'Veteran Resource Center (132 Kerckhoff Hall)', lat: 34.0705, lng: -118.4443, type: 'ucla_narcan', icon: NARCAN_ICON, markerColor: NARCAN_PURPLE },
]

const INFO_ROWS = [
  ['Version', '1.0.0'],
  ['AI Model', 'claude-haiku-4-5'],
  ['Session storage', 'Device only'],
  ['Location access', 'On demand only'],
]
 
// Mock SOS queue data
const MOCK_SOS_QUEUE: Omit<SOSPerson, 'dist'>[] = [
  { id: 'sos_1', firstName: 'Alex', lat: 34.0745, lng: -118.4428, resourceNeeded: 'naloxone', volunteersYes: 2 },
  { id: 'sos_2', firstName: 'Jordan', lat: 34.0699, lng: -118.4460, resourceNeeded: 'hospital', volunteersYes: 1 },
  { id: 'sos_3', firstName: 'Casey', lat: 34.0710, lng: -118.4475, resourceNeeded: 'counseling', volunteersYes: 0 },
  { id: 'sos_4', firstName: 'Morgan', lat: 34.0680, lng: -118.4400, resourceNeeded: 'naloxone', volunteersYes: 3 },
]

// ── helpers ────────────────────────────────────────────────────────────────

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3959
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

async function fetchNearby(lat: number, lng: number, type: typeof PLACE_TYPES[0]): Promise<Place[]> {
  if (!type.query) return []
  const q = `[out:json][timeout:15];(node["amenity"="${type.query}"](around:5000,${lat},${lng});way["amenity"="${type.query}"](around:5000,${lat},${lng}););out center 4;`
  try {
    const resp = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q })
    const data = await resp.json()
    return (data.elements || []).slice(0, 4).map((el: any, i: number) => {
      const elat = el.lat ?? el.center?.lat ?? lat
      const elng = el.lon ?? el.center?.lon ?? lng
      return {
        id: `${type.id}_${i}`,
        name: el.tags?.name || type.name,
        lat: elat,
        lng: elng,
        type: type.id,
        icon: type.icon,
        markerColor: type.markerColor,
        dist: haversine({ lat, lng }, { lat: elat, lng: elng }).toFixed(1),
      }
    })
  } catch {
    return []
  }
}

function withDistances(sites: Omit<Place, 'dist'>[], origin?: { lat: number; lng: number }): Place[] {
  return sites.map(site => ({
    ...site,
    dist: origin ? haversine(origin, { lat: site.lat, lng: site.lng }).toFixed(1) : undefined,
  }))
}

// ── icons ──────────────────────────────────────────────────────────────────

function PersonIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={8} r={3.5} stroke={L.textSecondary} strokeWidth={1.7} />
      <Path d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7"
        stroke={L.textSecondary} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  )
}

// ── main screen ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { userName, saveUserName, emergencyActive, alertSettings } = useApp()
  const insets = useSafeAreaInsets()

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [places, setPlaces] = useState<Place[]>(() => withDistances(UCLA_NARCAN_SITES))
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [fullMapOpen, setFullMapOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [nameInput, setNameInput] = useState(userName)
  const [saved, setSaved] = useState(false)

  // Volunteer SOS queue state
  const [isVolunteer] = useState(true) // Demo: user is certified volunteer
  const [sosQueue, setSOSQueue] = useState<SOSPerson[]>(() => {
    return MOCK_SOS_QUEUE.map(p => ({
      ...p,
      dist: '0.5', // Will update after location is loaded
    })).sort((a, b) => parseFloat(a.dist || '0') - parseFloat(b.dist || '0'))
  })
  const [selectedSOSPerson, setSelectedSOSPerson] = useState<SOSPerson | null>(null)
  const [volunteersHelpingState, setVolunteersHelpingState] = useState<Record<string, boolean>>({})
  const [volunteerMarkerCoord, setVolunteerMarkerCoord] = useState({
    latitude: VOLUNTEER_DEFAULT_LOCATION.lat,
    longitude: VOLUNTEER_DEFAULT_LOCATION.lng,
  })

  const mapRef = useRef<MapView>(null)

  useEffect(() => { 
    loadLocationAndPlaces()
  }, [])

  // On every map focus, reset the volunteer marker and replay the motion to the user location.
  useFocusEffect(
    useCallback(() => {
      const durationMs = 7000
      const fromLat = VOLUNTEER_DEFAULT_LOCATION.lat
      const fromLng = VOLUNTEER_DEFAULT_LOCATION.lng
      const toLat = USER_DEFAULT_LOCATION.lat
      const toLng = USER_DEFAULT_LOCATION.lng
      const startAt = Date.now()
      let frameId = 0

      setVolunteerMarkerCoord({
        latitude: fromLat,
        longitude: fromLng,
      })

      const animate = () => {
        const elapsed = Date.now() - startAt
        const t = Math.min(elapsed / durationMs, 1)
        const eased = t * t * (3 - 2 * t)

        setVolunteerMarkerCoord({
          latitude: fromLat + (toLat - fromLat) * eased,
          longitude: fromLng + (toLng - fromLng) * eased,
        })

        if (t < 1) {
          frameId = requestAnimationFrame(animate)
        }
      }

      frameId = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(frameId)
    }, [])
  )

  // When an emergency is started in the app, add the current user to the SOS queue.
  // Do not add duplicates (based on a stable id or firstName).
  useEffect(() => {
    if (!emergencyActive) return

    setSOSQueue(prev => {
      const first = userName ? userName.trim().split(' ')[0] : 'You'
      // Prevent duplicates by id or name
      if (prev.some(p => p.id === 'me_sos' || p.firstName === first)) return prev

      const lat = userLoc?.lat ?? UCLA_CENTER.lat
      const lng = userLoc?.lng ?? UCLA_CENTER.lng
      const dist = userLoc ? haversine(userLoc, { lat, lng }).toFixed(1) : undefined

      const me: SOSPerson = {
        id: 'me_sos',
        firstName: first,
        lat, lng,
        resourceNeeded: 'naloxone',
        volunteersYes: 0,
        dist,
      }

      return [...prev, me].sort((a, b) => parseFloat(a.dist || '0') - parseFloat(b.dist || '0'))
    })
  }, [emergencyActive, userName, userLoc])

  async function loadLocationAndPlaces() {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setLoading(false); return }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserLoc(loc)
      const results = await Promise.all(PLACE_TYPES.map(t => fetchNearby(loc.lat, loc.lng, t)))
      setPlaces([...results.flat(), ...withDistances(UCLA_NARCAN_SITES, loc)])
      
      // Update SOS queue distances
      const queueWithDist = MOCK_SOS_QUEUE.map(p => ({
        ...p,
        dist: haversine(loc, { lat: p.lat, lng: p.lng }).toFixed(1),
      })).sort((a, b) => parseFloat(a.dist || '0') - parseFloat(b.dist || '0'))
      setSOSQueue(queueWithDist)
    } catch {}
    setLoading(false)
  }

  function saveName() {
    saveUserName(nameInput.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function openDirections(place: Place) {
    Linking.openURL(`https://maps.apple.com/?daddr=${place.lat},${place.lng}&dirflg=d`)
  }

  function handleVolunteerResponse(person: SOSPerson) {
    const isCurrentlyHelping = volunteersHelpingState[person.id] === true
    const newHelpingState = !isCurrentlyHelping
    const sharedVolunteerLocation = newHelpingState && alertSettings.shareVolunteerLocation
      ? VOLUNTEER_DEFAULT_LOCATION.label
      : undefined
    
    // Update volunteer count based on new state
    const delta = newHelpingState ? 1 : -1
    setSOSQueue(prev => prev.map(p => 
      p.id === person.id ? {
        ...p,
        volunteersYes: Math.max(0, p.volunteersYes + delta),
        volunteerLocation: sharedVolunteerLocation,
      } : p
    ))
    setSelectedSOSPerson(prev => 
      prev && prev.id === person.id ? {
        ...prev,
        volunteersYes: Math.max(0, prev.volunteersYes + delta),
        volunteerLocation: sharedVolunteerLocation,
      } : prev
    )
    
    setVolunteersHelpingState(prev => ({ ...prev, [person.id]: newHelpingState }))
  }

  const initials = userName
    ? userName.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : null

  const region = userLoc
    ? { latitude: userLoc.lat, longitude: userLoc.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    : { latitude: UCLA_CENTER.lat, longitude: UCLA_CENTER.lng, latitudeDelta: 0.025, longitudeDelta: 0.025 }

  const filteredPlaces = (activeFilter ? places.filter(p => p.type === activeFilter) : places)
    .slice()
    .sort((a, b) => parseFloat(a.dist ?? '9999') - parseFloat(b.dist ?? '9999'))
  const visiblePlaces = filteredPlaces.slice(0, 6)
  const shouldShowVolunteerLocation = isVolunteer && alertSettings.shareVolunteerLocation

  if (fullMapOpen) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.fullHeader}>
          <TouchableOpacity style={s.fullBackBtn} onPress={() => setFullMapOpen(false)} activeOpacity={0.75}>
            <Text style={s.fullBackText}>‹</Text>
          </TouchableOpacity>
          <View style={s.fullHeaderCopy}>
            <Text style={s.fullTitle}>Nearby resources</Text>
            <Text style={s.fullSubtitle}>{filteredPlaces.length} places near you</Text>
          </View>
          <TouchableOpacity style={s.fullRefreshBtn} onPress={loadLocationAndPlaces} disabled={loading} activeOpacity={0.75}>
            <Text style={s.fullRefreshText}>{loading ? '...' : '↻'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fullChips}>
          <TouchableOpacity
            style={[s.fullChip, !activeFilter && s.chipActive]}
            onPress={() => setActiveFilter(null)}
          >
            <Text numberOfLines={1} style={[s.fullChipText, !activeFilter && s.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {PLACE_TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.fullChip, activeFilter === t.id && s.chipActive]}
              onPress={() => setActiveFilter(activeFilter === t.id ? null : t.id)}
            >
              <Text numberOfLines={1} style={[s.fullChipText, activeFilter === t.id && s.chipTextActive]}>
                {t.icon} {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.fullMapWrap}>
          <MapView
            style={s.fullMap}
            region={region}
            provider={PROVIDER_DEFAULT}
            showsUserLocation={!!userLoc}
            showsMyLocationButton
            userInterfaceStyle="light"
          >
            {filteredPlaces.map(p => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                title={p.name}
                description={p.dist ? `${p.dist} mi away` : undefined}
              >
                <View style={[s.markerBubble, { backgroundColor: p.markerColor }]}>
                  <Text style={s.markerIcon}>{p.icon}</Text>
                </View>
              </Marker>
            ))}
            <Marker
              key="user-default-location-full"
              coordinate={{ latitude: USER_DEFAULT_LOCATION.lat, longitude: USER_DEFAULT_LOCATION.lng }}
              title="Your default location"
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={998}
              tracksViewChanges
            >
              <View style={s.userDefaultMarkerBubble}>
                <Feather name="map-pin" size={24} color="white" />
              </View>
            </Marker>
            {shouldShowVolunteerLocation ? (
              <Marker
                key="volunteer-location-full"
                coordinate={volunteerMarkerCoord}
                title="Volunteer location"
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={999}
                tracksViewChanges
              >
                <View style={s.volunteerMarkerBubble}>
                  <MaterialCommunityIcons name="hand-heart-outline" size={24} color="#fff" />
                </View>
              </Marker>
            ) : null}
          </MapView>
          {loading && (
            <View style={s.mapLoadingOverlay}>
              <ActivityIndicator size="small" color={L.red} />
            </View>
          )}
        </View>

        <ScrollView
          style={s.fullList}
          contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredPlaces.slice(0, 12).map(p => (
            <TouchableOpacity key={p.id} style={s.placeRow} onPress={() => openDirections(p)} activeOpacity={0.7}>
              <View style={[s.placeIconWrap, { backgroundColor: p.markerColor + '18' }]}>
                <Text style={s.placeIcon}>{p.icon}</Text>
              </View>
              <View style={s.placeInfo}>
                <Text style={s.placeName}>{p.name}</Text>
                {!!p.dist && <Text style={s.placeDist}>{p.dist} mi away</Text>}
              </View>
              <Text style={s.placeArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* ── header ── */}
      <View style={s.header}>
        <View style={s.headerCopy}>
          <Text style={s.title}>Map</Text>
          <Text style={s.subtitle}>Find nearby support resources.</Text>
        </View>
        <TouchableOpacity style={s.accountBtn} onPress={() => { setAccountOpen(true) }}>
          {isVolunteer ? (
            <MaterialCommunityIcons name="hand-heart-outline" size={24} color="red" />
          ) : (
            <PersonIcon />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Nearby resources</Text>
          <TouchableOpacity onPress={() => setFullMapOpen(true)} activeOpacity={0.7}>
            <Text style={s.sectionAction}>Open full map</Text>
          </TouchableOpacity>
        </View>

        {/* ── map card ── */}
        <View style={s.mapCard}>
          <MapView
            ref={mapRef}
            style={s.map}
            region={region}
            provider={PROVIDER_DEFAULT}
            showsUserLocation={!!userLoc}
            showsMyLocationButton={false}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            userInterfaceStyle="light"
          >
            {visiblePlaces.map(p => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                title={p.name}
              >
                <View style={[s.markerBubble, { backgroundColor: p.markerColor }]}>
                  <Text style={s.markerIcon}>{p.icon}</Text>
                </View>
              </Marker>
            ))}
            <Marker
              key="user-default-location-card"
              coordinate={{ latitude: USER_DEFAULT_LOCATION.lat, longitude: USER_DEFAULT_LOCATION.lng }}
              title="Your location"
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={998}
              tracksViewChanges
            >
              <View style={s.userDefaultMarkerBubble}>
                <Feather name="map-pin" size={24} color="white" />
              </View>
            </Marker>
            {shouldShowVolunteerLocation ? (
              <Marker
                key="volunteer-location-card"
                coordinate={volunteerMarkerCoord}
                title="Volunteer"
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={999}
                tracksViewChanges
              >
                <View style={s.volunteerMarkerBubble}>
                  <MaterialCommunityIcons name="hand-heart-outline" size={24} color="#fff" />
                </View>
              </Marker>
            ) : null}
          </MapView>
          {/* <TouchableOpacity
            style={s.mapTapOverlay}
            activeOpacity={0.85}
            onPress={() => setFullMapOpen(true)}
          >
            <View style={s.mapOpenPill}>
              <Text style={s.mapOpenText}>Expand map</Text>
            </View>
          </TouchableOpacity> */}
          {loading && (
            <View style={s.mapLoadingOverlay}>
              <ActivityIndicator size="small" color={L.red} />
            </View>
          )}
        </View>

        {/* ── filter chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <TouchableOpacity
            style={[s.chip, !activeFilter && s.chipActive]}
            onPress={() => setActiveFilter(null)}
          >
            <Text style={[s.chipText, !activeFilter && s.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {PLACE_TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.chip, activeFilter === t.id && s.chipActive]}
              onPress={() => setActiveFilter(activeFilter === t.id ? null : t.id)}
            >
              <Text style={[s.chipText, activeFilter === t.id && s.chipTextActive]}>
                {t.icon} {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── nearby list ── */}
        {!userLoc && !loading ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>📍</Text>
            <Text style={s.emptyTitle}>Enable location</Text>
            <Text style={s.emptyBody}>See hospitals, pharmacies, and naloxone nearby.</Text>
            <TouchableOpacity style={s.enableBtn} onPress={loadLocationAndPlaces}>
              <Text style={s.enableBtnText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          visiblePlaces.map(p => (
            <TouchableOpacity key={p.id} style={s.placeRow} onPress={() => openDirections(p)} activeOpacity={0.7}>
              <View style={[s.placeIconWrap, { backgroundColor: p.markerColor + '18' }]}>
                <Text style={s.placeIcon}>{p.icon}</Text>
              </View>
              <View style={s.placeInfo}>
                <Text style={s.placeName}>{p.name}</Text>
                {!!p.dist && <Text style={s.placeDist}>{p.dist} mi away</Text>}
              </View>
              <Text style={s.placeArrow}>›</Text>
            </TouchableOpacity>
          ))
        )}

        {/* ── footnote ── */}
        <Text style={s.footnote}>
          SafeReach v1.0.0 · AI for guidance only · Always call 911 in emergencies
        </Text>
      </ScrollView>

      {/* ── volunteer SOS queue modal ── */}
      <Modal visible={accountOpen && isVolunteer} animationType="slide">
        <View style={[s.fullscreenModal, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {/* Header with close button */}
          <View style={s.modalHeader}>
            <Text style={s.modalHeaderTitle}>Help Queue</Text>
            <TouchableOpacity onPress={() => { setAccountOpen(false); setSelectedSOSPerson(null) }} style={s.modalCloseBtn}>
              <Text style={s.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {!selectedSOSPerson ? (
            <>
              <Text style={s.modalSubtitle}>{sosQueue.length} people need help</Text>
              
              <ScrollView style={s.fullQueueList} showsVerticalScrollIndicator={false}>
                {sosQueue.length === 0 ? (
                  <View style={s.emptyQueueWrap}>
                    <Text style={s.emptyQueueIcon}>✓</Text>
                    <Text style={s.emptyQueueTitle}>No active emergencies</Text>
                    <Text style={s.emptyQueueCopy}>Check back soon</Text>
                  </View>
                ) : (
                  sosQueue.map(person => (
                    <View key={person.id} style={s.queueItemContainer}>
                      <TouchableOpacity
                        style={s.queueItemTap}
                        onPress={() => setSelectedSOSPerson(person)}
                        activeOpacity={0.7}
                      >
                        <View style={s.queueLeft}>
                          <Text style={s.queueName}>{person.firstName}</Text>
                          <Text style={s.queueDist}>{person.dist} mi away</Text>
                        </View>
                        <Text style={s.queueVolunteers}><Ionicons name="people-outline" size={24} color="red" /> {person.volunteersYes}</Text>
                      </TouchableOpacity>
                      
                      <View style={s.queueButtonsRow}>
                        <TouchableOpacity
                          style={[s.queueHelpBtn, volunteersHelpingState[person.id] && s.queueHelpBtnActive]}
                          onPress={() => handleVolunteerResponse(person)}
                        >
                          <Text style={[s.queueHelpBtnText, volunteersHelpingState[person.id] && { color: '#fff' }]}>
                            {volunteersHelpingState[person.id] ? 'Cancel' : 'Help?'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => setSelectedSOSPerson(null)} style={s.backRow}>
                <Text style={s.backText}>‹ Back</Text>
              </TouchableOpacity>
              <Text style={s.modalHeaderTitle}>{selectedSOSPerson.firstName}</Text>
              
              <ScrollView style={s.fullQueueList} showsVerticalScrollIndicator={false}>
                <View style={s.detailCard}>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Location</Text>
                    <Text style={s.detailValue}>{selectedSOSPerson.lat.toFixed(4)}, {selectedSOSPerson.lng.toFixed(4)}</Text>
                  </View>
                  <View style={[s.detailRow, s.detailRowBorder]}>
                    <Text style={s.detailLabel}>Distance</Text>
                    <Text style={s.detailValue}>{selectedSOSPerson.dist} mi</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Resource Needed</Text>
                    <Text style={s.detailValue}>
                      {selectedSOSPerson.resourceNeeded === 'naloxone' && '💊 Naloxone'}
                      {selectedSOSPerson.resourceNeeded === 'hospital' && '🏥 Hospital'}
                      {selectedSOSPerson.resourceNeeded === 'counseling' && '🎧 Counseling'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  )
}

// ── styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: L.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0A0A0A', fontFamily: 'System', letterSpacing: -0.4 },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: L.textSecondary,
    fontFamily: 'System',
    lineHeight: 20,
  },
  accountBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: L.surface,
    borderWidth: 1, borderColor: L.border,
    alignItems: 'center', justifyContent: 'center',
  },
  accountInitials: { fontSize: 13, fontWeight: '700', color: L.textSecondary },

  accountText: { fontSize: 13, fontWeight: '700', color: L.red },

  body: { paddingHorizontal: 16, gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: L.red,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: L.border,
  },
  fullBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: L.surface,
    borderWidth: 1,
    borderColor: L.border,
  },
  fullBackText: {
    fontSize: 32,
    lineHeight: 34,
    color: '#0A0A0A',
    marginTop: -2,
  },
  fullHeaderCopy: {
    flex: 1,
  },
  fullTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  fullSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: L.textSecondary,
  },
  fullRefreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: L.surface,
    borderWidth: 1,
    borderColor: L.border,
  },
  fullRefreshText: {
    fontSize: 18,
    color: L.textSecondary,
    fontWeight: '700',
  },
  fullChips: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: L.surface,
    borderWidth: 1,
    borderColor: L.border,
    alignSelf: 'flex-start',
  },
  fullChipText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: L.textSecondary,
  },
  fullMapWrap: {
    height: 390,
    marginHorizontal: 16,
    marginTop: -300,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: L.border,
    backgroundColor: L.surface,
  },
  fullMap: {
    flex: 1,
  },
  fullList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Map
  mapCard: {
    height: 230, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: L.border,
    backgroundColor: L.surface,
  },
  map: { flex: 1 },
  mapTapOverlay: {
    position: 'absolute', bottom: 10, right: 10,
  },
  mapOpenPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1, borderColor: L.border,
  },
  mapOpenText: { fontSize: 12, fontWeight: '600', color: '#0A0A0A' },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  markerBubble: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  markerIcon: { fontSize: 14 },
  volunteerMarkerBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    borderWidth: 3,
    borderColor: '#FDBA74',
    shadowColor: '#F97316',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  userDefaultMarkerBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4169E1',
    borderWidth: 3,
    borderColor: '#93C5FD',
    shadowColor: '#4169E1',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // Chips
  chips: { paddingHorizontal: 0, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: L.surface,
    borderWidth: 1, borderColor: L.border,
  },
  chipActive: { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' },
  chipText: { fontSize: 13, fontWeight: '600', color: L.textSecondary },
  chipTextActive: { color: '#fff' },

  // Places
  placeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: L.border,
  },
  placeIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  placeIcon: { fontSize: 18 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A', marginBottom: 2 },
  placeDist: { fontSize: 12, color: L.textSecondary },
  placeArrow: { fontSize: 20, color: L.textMuted },

  // Empty state
  emptyCard: {
    alignItems: 'center', gap: 8,
    paddingVertical: 36, paddingHorizontal: 24,
    backgroundColor: L.surface,
    borderRadius: 16, borderWidth: 1, borderColor: L.border,
  },
  emptyIcon: { fontSize: 28 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#0A0A0A' },
  emptyBody: { fontSize: 14, color: L.textSecondary, textAlign: 'center', lineHeight: 20 },
  enableBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: '#0A0A0A', borderRadius: 999,
  },
  enableBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  footnote: {
    fontSize: 11, color: L.textFaint, textAlign: 'center',
    lineHeight: 16, paddingVertical: 8,
  },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.22)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12, gap: 16,
    borderTopWidth: 1, borderColor: L.border,
  },
  sheetFlex: {
    flex: 1,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: L.border,
    alignSelf: 'center', marginBottom: 4,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#0A0A0A' },
  sheetAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sheetAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(204,34,34,0.1)',
    borderWidth: 1, borderColor: 'rgba(204,34,34,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetAvatarText: { fontSize: 20, fontWeight: '800', color: L.red },
  sheetName: { fontSize: 17, fontWeight: '600', color: '#0A0A0A' },
  sheetNameSub: { fontSize: 12, color: L.textSecondary, marginTop: 2 },

  nameRow: { flexDirection: 'row', gap: 10 },
  nameInput: {
    flex: 1, height: 44,
    backgroundColor: L.surface,
    borderWidth: 1, borderColor: L.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15, color: '#0A0A0A',
  },
  saveBtn: {
    paddingHorizontal: 16, height: 44,
    backgroundColor: L.red, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  infoCard: {
    backgroundColor: L.surface,
    borderRadius: 12, borderWidth: 1, borderColor: L.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: L.border },
  infoLabel: { fontSize: 14, color: '#0A0A0A' },
  infoValue: { fontSize: 13, color: L.textSecondary },

  sheetDisclaimer: {
    fontSize: 11, color: L.textMuted, lineHeight: 16, textAlign: 'center', paddingBottom: 4,
  },

  // Volunteer Queue
  sheetSubtitle: { fontSize: 13, color: L.textSecondary, marginBottom: 12 },
  queueScrollView: {
    flex: 1,
    minHeight: 100,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: L.border,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: L.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: L.textSecondary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: L.textSecondary,
    marginTop: 12,
    marginBottom: 12,
  },
  fullQueueList: {
    flex: 1,
  },
  queueItemContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: L.border,
  },
  queueItemTap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  queueButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyQueueWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 48, gap: 12,
  },
  emptyQueueIcon: { fontSize: 40 },
  emptyQueueTitle: { fontSize: 16, fontWeight: '600', color: '#0A0A0A' },
  emptyQueueCopy: { fontSize: 13, color: L.textSecondary },
  
  queueLeft: { flex: 1 },
  queueName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A', marginBottom: 4 },
  queueDist: { fontSize: 12, color: L.textSecondary },
  queueLocation: { fontSize: 11, color: L.red, fontWeight: '600', marginTop: 4, lineHeight: 15 },
  queueVolunteers: { fontSize: 12, fontWeight: '600', color: L.red },
  
  queueHelpBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: L.red,
    backgroundColor: 'transparent',
  },
  queueHelpBtnActive: {
    backgroundColor: L.red,
  },
  queueHelpBtnText: { fontSize: 11, fontWeight: '600', color: L.red },
  
  backRow: { paddingVertical: 8, marginBottom: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: L.red },
  
  detailCard: {
    backgroundColor: L.surface,
    borderRadius: 12, borderWidth: 1, borderColor: L.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: L.border },
  detailLabel: { fontSize: 13, color: L.textSecondary, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#0A0A0A', textAlign: 'right', flex: 1, marginLeft: 12 },
})
