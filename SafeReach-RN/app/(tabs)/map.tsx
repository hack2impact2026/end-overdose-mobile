import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, ScrollView } from 'react-native'
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps'
import * as Location from 'expo-location'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../../src/AppContext'
import { colors, radius, font } from '../../src/theme'

const PLACE_TYPES = [
  { id: 'hospital', name: 'Hospital', icon: '🏥', color: colors.red, query: 'hospital' },
  { id: 'naloxone', name: 'Naloxone', icon: '💊', color: colors.green, query: 'pharmacy' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '🏪', color: colors.amber, query: 'pharmacy' },
  { id: 'urgent', name: 'Urgent Care', icon: '🩺', color: colors.blue, query: 'urgent care' },
]

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

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3959
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

async function fetchNearby(lat: number, lng: number, type: typeof PLACE_TYPES[0]): Promise<Place[]> {
  const radius_m = 5000
  const query = `[out:json][timeout:15];(node["amenity"="${type.query}"](around:${radius_m},${lat},${lng});way["amenity"="${type.query}"](around:${radius_m},${lat},${lng}););out center 5;`
  try {
    const resp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: query,
    })
    const data = await resp.json()
    return (data.elements || []).slice(0, 5).map((el: any, i: number) => {
      const elat = el.lat || el.center?.lat || lat
      const elng = el.lon || el.center?.lon || lng
      const dist = haversine({ lat, lng }, { lat: elat, lng: elng }).toFixed(1)
      return {
        id: `${type.id}_${i}`,
        name: el.tags?.name || type.name,
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
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Place | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    getLocationAndPlaces()
  }, [])

  async function getLocationAndPlaces() {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setLoading(false); return }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setLocation(loc)

      // Fetch all place types in parallel
      const results = await Promise.all(PLACE_TYPES.map(t => fetchNearby(loc.lat, loc.lng, t)))
      setPlaces(results.flat())
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
    latitude: 37.7749, longitude: -122.4194,
    latitudeDelta: 0.1, longitudeDelta: 0.1,
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
