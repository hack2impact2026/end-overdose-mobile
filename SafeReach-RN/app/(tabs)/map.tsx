import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, ScrollView } from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import * as Location from 'expo-location'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../../src/AppContext'
import { colors, radius, font } from '../../src/theme'

const NARCAN_PURPLE = '#8B5CF6'
const NARCAN_ICON = '💊'
const UCLA_CENTER = { lat: 34.0709, lng: -118.444 }

interface Place {
  id: string
  name: string
  lat: number
  lng: number
  type: string
  icon: string
  color: string
  dist?: string
}

const UCLA_NARCAN_SITES: Omit<Place, 'dist'>[] = [
  { id: 'uclan_0', name: 'Arthur Ashe Student Health & Wellness Center', lat: 34.0699, lng: -118.4449, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_1', name: 'Office of Fraternity & Sorority Life (109 Kerckhoff)', lat: 34.0706, lng: -118.4441, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_2', name: 'CARE & Case Management Services (205 Covel Commons)', lat: 34.0752, lng: -118.4491, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_3', name: 'Transfer Student Center (128 Kerckhoff Hall)', lat: 34.0706, lng: -118.4442, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_4', name: 'Student Wellness Commission Peer Support Lounge (308 Kerckhoff)', lat: 34.0707, lng: -118.444, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_5', name: 'Bruin Resource Center (SAC B44)', lat: 34.071, lng: -118.4454, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_6', name: 'Financial Wellness (106 Strathmore)', lat: 34.0659, lng: -118.4428, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_7', name: 'Fielding School of Public Health (Floor 1, Corridor 6)', lat: 34.0697, lng: -118.4418, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_8', name: 'Debt Management Services (Murphy Hall A227)', lat: 34.0718, lng: -118.4397, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_9', name: 'LGBTQ+ Campus Resource Center (SAC B36)', lat: 34.0711, lng: -118.4455, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_10', name: 'RISE Center (Lu Valle Commons Basement)', lat: 34.0688, lng: -118.4426, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_11', name: 'Latinx Success Center (De Neve B1 Lounge)', lat: 34.0731, lng: -118.4484, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_12', name: 'School of Theater, Film & Television (East Melnitz 103)', lat: 34.0736, lng: -118.4413, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_13', name: 'UCLA Dept of Art (Broad Art Center, 2nd Floor Lobby)', lat: 34.0757, lng: -118.4393, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_14', name: 'John Wooden Center (221 Westwood Plaza)', lat: 34.072, lng: -118.4466, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_15', name: 'Bruin Fitness Center (251 Charles E Young Dr)', lat: 34.0714, lng: -118.4472, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_16', name: 'Kinross Recreation Center (11100 Kinross Ave)', lat: 34.0589, lng: -118.4482, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_17', name: 'Student Activities Center (220 Westwood Plaza)', lat: 34.071, lng: -118.4453, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_18', name: 'Dykstra/De Neve Front Desk (Dykstra Hall)', lat: 34.0726, lng: -118.449, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_19', name: 'Hedrick Court Front Desk (Hedrick Hall)', lat: 34.0742, lng: -118.4477, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_20', name: 'Rieber Court Front Desk (Rieber Hall)', lat: 34.0733, lng: -118.4462, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_21', name: 'Sproul Court Front Desk (Sproul Hall)', lat: 34.0741, lng: -118.4494, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_22', name: 'University Apartments North Front Desk', lat: 34.064, lng: -118.4411, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_23', name: 'University Apartments South (UAS) RA Office', lat: 34.0621, lng: -118.444, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  { id: 'uclan_24', name: 'Veteran Resource Center (132 Kerckhoff Hall)', lat: 34.0705, lng: -118.4443, type: 'ucla_narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
]

interface PlaceType {
  id: string
  name: string
  icon: string
  color: string
  query?: string
  customQuery?: (lat: number, lng: number, radius: number) => string
}

const PLACE_TYPES: PlaceType[] = [
  { id: 'hospital', name: 'Hospital', icon: '🏥', color: colors.red, query: 'hospital' },
  { id: 'naloxone', name: 'Naloxone', icon: NARCAN_ICON, color: NARCAN_PURPLE, query: 'pharmacy' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '🏪', color: colors.amber, query: 'pharmacy' },
  { id: 'urgent', name: 'Urgent Care', icon: '🩺', color: colors.blue, query: 'urgent care' },
  { id: 'ucla_narcan', name: 'UCLA Narcan', icon: NARCAN_ICON, color: NARCAN_PURPLE },
  {
    id: 'narcan_site',
    name: 'Narcan Site',
    icon: NARCAN_ICON,
    color: NARCAN_PURPLE,
    customQuery: (lat, lng, r) =>
      `[out:json][timeout:20];(` +
      `node["amenity"="social_facility"]["social_facility:for"="drug_addicted"](around:${r},${lat},${lng});` +
      `way["amenity"="social_facility"]["social_facility:for"="drug_addicted"](around:${r},${lat},${lng});` +
      `node["healthcare"="counselling"](around:${r},${lat},${lng});` +
      `way["healthcare"="counselling"](around:${r},${lat},${lng});` +
      `node["amenity"="vending_machine"]["vending"="drugs"](around:${r},${lat},${lng});` +
      `node["amenity"="vending_machine"]["vending"="naloxone"](around:${r},${lat},${lng});` +
      `);out center 10;`,
  },
]

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3959
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function withDistances(sites: Omit<Place, 'dist'>[], origin?: { lat: number; lng: number }): Place[] {
  return sites.map(site => ({
    ...site,
    dist: origin ? haversine(origin, { lat: site.lat, lng: site.lng }).toFixed(1) : undefined,
  }))
}

async function fetchNearby(lat: number, lng: number, type: PlaceType): Promise<Place[]> {
  const radius_m = 5000
  const query = type.customQuery
    ? type.customQuery(lat, lng, radius_m)
    : `[out:json][timeout:15];(node["amenity"="${type.query}"](around:${radius_m},${lat},${lng});way["amenity"="${type.query}"](around:${radius_m},${lat},${lng}););out center 5;`
  try {
    const resp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: query,
    })
    const data = await resp.json()
    return (data.elements || []).slice(0, 10).map((el: any, i: number) => {
      const elat = el.lat || el.center?.lat || lat
      const elng = el.lon || el.center?.lon || lng
      const dist = haversine({ lat, lng }, { lat: elat, lng: elng }).toFixed(1)
      return {
        id: `${type.id}_${i}`,
        name: el.tags?.name || el.tags?.operator || type.name,
        lat: elat, lng: elng,
        type: type.id, icon: type.icon, color: type.color,
        dist,
      }
    })
  } catch { return [] }
}

export default function MapScreen() {
  const { location, setLocation } = useApp()
  const insets = useSafeAreaInsets()
  const [places, setPlaces] = useState<Place[]>(() => withDistances(UCLA_NARCAN_SITES))
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Place | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const watchRef = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    startLocationTracking()
    return () => { watchRef.current?.remove() }
  }, [])

  async function loadPlacesForLocation(loc: { lat: number; lng: number }) {
    const fetchableTypes = PLACE_TYPES.filter(t => t.query || t.customQuery)
    const results = await Promise.all(fetchableTypes.map(t => fetchNearby(loc.lat, loc.lng, t)))
    setPlaces([...results.flat(), ...withDistances(UCLA_NARCAN_SITES, loc)])
  }

  async function startLocationTracking() {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setLoading(false); return }

      watchRef.current?.remove()

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setLocation(loc)

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        update => {
          setLocation({ lat: update.coords.latitude, lng: update.coords.longitude })
        }
      )

      await loadPlacesForLocation(loc)
    } catch {}
    setLoading(false)
  }

  async function getLocationAndPlaces() {
    setLoading(true)
    try {
      if (location) {
        await loadPlacesForLocation(location)
      } else {
        await startLocationTracking()
      }
    } catch {}
    setLoading(false)
  }

  const filteredPlaces = activeFilter ? places.filter(p => p.type === activeFilter) : places

  function openDirections(place: Place) {
    const url = `https://maps.apple.com/?daddr=${place.lat},${place.lng}&dirflg=d`
    Linking.openURL(url)
  }

  const region = location ? {
    latitude: location.lat,
    longitude: location.lng,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  } : {
    latitude: UCLA_CENTER.lat,
    longitude: UCLA_CENTER.lng,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Nearby Resources</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={getLocationAndPlaces} disabled={loading}>
          <Text style={s.refreshBtnText}>{loading ? '...' : '↻'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        <TouchableOpacity
          style={[s.filterChip, !activeFilter && s.filterChipActive]}
          onPress={() => setActiveFilter(null)}
        >
          <Text style={[s.filterChipText, !activeFilter && s.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {PLACE_TYPES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.filterChip, activeFilter === t.id && s.filterChipActive]}
            onPress={() => setActiveFilter(activeFilter === t.id ? null : t.id)}
          >
            <Text style={s.filterChipText}>{t.icon} {t.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map */}
      <View style={s.mapContainer}>
        {loading && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.red} />
            <Text style={s.loadingText}>Finding your location...</Text>
          </View>
        )}
        <MapView
          style={s.map}
          region={region}
          provider={PROVIDER_DEFAULT}
          showsUserLocation
          showsMyLocationButton={false}
          userInterfaceStyle="dark"
          onPress={() => setSelected(null)}
        >
          {filteredPlaces.map(place => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              title={place.name}
              onPress={() => setSelected(place)}
            >
              <View style={[s.markerBubble, { backgroundColor: place.color }]}>
                <Text style={s.markerIcon}>{place.icon}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Selected place card */}
      {selected && (
        <View style={s.placeCard}>
          <View style={s.placeCardLeft}>
            <Text style={s.placeCardIcon}>{selected.icon}</Text>
            <View>
              <Text style={s.placeCardName}>{selected.name}</Text>
              {selected.dist && <Text style={s.placeCardDist}>{selected.dist} miles away</Text>}
            </View>
          </View>
          <TouchableOpacity style={s.directionsBtn} onPress={() => openDirections(selected)}>
            <Text style={s.directionsBtnText}>Directions →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Place list */}
      {!selected && filteredPlaces.length > 0 && (
        <ScrollView style={s.placeList} showsVerticalScrollIndicator={false}>
          {filteredPlaces.slice(0, 6).map(place => (
            <TouchableOpacity key={place.id} style={s.placeRow} onPress={() => setSelected(place)}>
              <Text style={s.placeRowIcon}>{place.icon}</Text>
              <View style={s.placeRowInfo}>
                <Text style={s.placeRowName}>{place.name}</Text>
                {place.dist && <Text style={s.placeRowDist}>{place.dist} mi</Text>}
              </View>
              <Text style={s.placeRowArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {!location && !loading && (
        <View style={s.noLocationCard}>
          <Text style={s.noLocationText}>📍 Enable location to find nearby resources</Text>
          <TouchableOpacity style={s.enableBtn} onPress={getLocationAndPlaces}>
            <Text style={s.enableBtnText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.white },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  refreshBtnText: { fontSize: 18, color: colors.textSecondary },
  filters: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.redDim, borderColor: colors.redBorder },
  filterChipText: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: colors.red },
  mapContainer: { height: 260, marginHorizontal: 14, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#111' },
  map: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10 },
  loadingText: { color: colors.textSecondary, fontSize: font.sm },
  markerBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  markerIcon: { fontSize: 16 },
  placeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 14, marginTop: 10, padding: 14, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  placeCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  placeCardIcon: { fontSize: 24 },
  placeCardName: { fontSize: font.md, fontWeight: '600', color: colors.white, marginBottom: 2 },
  placeCardDist: { fontSize: font.sm, color: colors.textMuted },
  directionsBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.blue, borderRadius: radius.md },
  directionsBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
  placeList: { flex: 1, paddingHorizontal: 14, paddingTop: 8 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  placeRowIcon: { fontSize: 20 },
  placeRowInfo: { flex: 1 },
  placeRowName: { fontSize: font.sm, fontWeight: '600', color: colors.white },
  placeRowDist: { fontSize: font.xs, color: colors.textMuted },
  placeRowArrow: { fontSize: 18, color: colors.textMuted },
  noLocationCard: { margin: 14, padding: 20, backgroundColor: 'rgba(232,0,13,0.06)', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.redBorder, alignItems: 'center', gap: 12 },
  noLocationText: { fontSize: font.sm, color: colors.textSecondary, textAlign: 'center' },
  enableBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.red, borderRadius: radius.md },
  enableBtnText: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
})
