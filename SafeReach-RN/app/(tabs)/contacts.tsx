import { useState } from 'react'
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { font, lightColors, radius } from '../../src/theme'

const nearbyResources = [
  {
    id: 'naloxone-kit',
    name: 'Downtown Harm Reduction Center',
    category: 'Naloxone',
    distance: '0.2 mi',
    status: 'Open now',
    detail: 'Free naloxone kits and overdose response supplies available today.',
    address: '1224 Mission St',
  },
  {
    id: 'pharmacy',
    name: 'Market Street Pharmacy',
    category: 'Pharmacy',
    distance: '0.4 mi',
    status: 'Open until 9 PM',
    detail: 'Ask the pharmacy counter for naloxone nasal spray.',
    address: '870 Market St',
  },
  {
    id: 'hospital',
    name: 'City General Emergency',
    category: 'Hospital',
    distance: '0.8 mi',
    status: '24/7',
    detail: 'Emergency department with overdose response care.',
    address: '1001 Potrero Ave',
  },
]

type NearbyResource = (typeof nearbyResources)[number]

function openResourceDetail(resource: NearbyResource) {
  Alert.alert(
    resource.name,
    `${resource.category} - ${resource.distance}\n${resource.status}\n\n${resource.detail}\n${resource.address}`,
    [{ text: 'OK' }],
  )
}

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets()
  const [selectedGuide, setSelectedGuide] = useState(false)

  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>Resources</Text>
          <Text style={s.subtitle}>Nearby help and quick guidance</Text>
        </View>

        <View style={s.sectionIntro}>
          <Text style={s.sectionTitle}>Closest help near you</Text>
          <Text style={s.sectionCopy}>Demo nearby results based on the map concept.</Text>
        </View>

        <View style={s.nearbyList}>
          {nearbyResources.map((resource) => (
            <Pressable
              key={resource.id}
              accessibilityRole="button"
              accessibilityLabel={`${resource.name}, ${resource.category}, ${resource.distance}`}
              onPress={() => openResourceDetail(resource)}
              style={({ pressed }) => [
                s.resourceCard,
                pressed && s.pressed,
              ]}
            >
              <View style={s.resourceTop}>
                <View style={s.categoryPill}>
                  <Text style={s.categoryText}>{resource.category}</Text>
                </View>
                <Text style={s.distance}>{resource.distance}</Text>
              </View>
              <Text style={s.resourceName}>{resource.name}</Text>
              <Text style={s.resourceMeta}>{resource.status}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.secondaryGroup}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedGuide((value) => !value)}
            style={({ pressed }) => [s.compactCard, pressed && s.pressed]}
          >
            <View style={s.compactText}>
              <Text style={s.compactLabel}>Quick guide</Text>
              <Text style={s.compactTitle}>How to use naloxone</Text>
              {selectedGuide ? (
                <Text style={s.guideCopy}>
                  Spray one dose into one nostril. Call 911, start rescue breathing if trained,
                  and give another dose after 2-3 minutes if there is no response.
                </Text>
              ) : null}
            </View>
            <Text style={s.chevron}>{selectedGuide ? '-' : '+'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL('tel:911')}
            style={({ pressed }) => [s.callCard, pressed && s.pressed]}
          >
            <View>
              <Text style={s.callLabel}>Need urgent help?</Text>
              <Text style={s.callTitle}>Call 911</Text>
            </View>
            <Text style={s.callAction}>Call</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: lightColors.bg,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    color: lightColors.textPrimary,
    fontSize: font['3xl'],
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: lightColors.textSecondary,
    fontSize: font.md,
    lineHeight: 21,
  },
  sectionIntro: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: lightColors.textPrimary,
    fontSize: font.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionCopy: {
    color: lightColors.textSecondary,
    fontSize: font.sm,
    lineHeight: 18,
  },
  nearbyList: {
    gap: 10,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: lightColors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  pressed: {
    opacity: 0.72,
  },
  resourceTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryPill: {
    backgroundColor: lightColors.redSoft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryText: {
    color: lightColors.red,
    fontSize: font.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  distance: {
    color: lightColors.textPrimary,
    fontSize: font.md,
    fontWeight: '700',
  },
  resourceName: {
    color: lightColors.textPrimary,
    fontSize: font.lg,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  resourceMeta: {
    color: lightColors.textSecondary,
    fontSize: font.sm,
    lineHeight: 18,
  },
  secondaryGroup: {
    gap: 10,
    marginTop: 18,
  },
  compactCard: {
    alignItems: 'center',
    backgroundColor: lightColors.surface,
    borderColor: lightColors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  compactText: {
    flex: 1,
  },
  compactLabel: {
    color: lightColors.textSecondary,
    fontSize: font.xs,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  compactTitle: {
    color: lightColors.textPrimary,
    fontSize: font.md,
    fontWeight: '700',
  },
  guideCopy: {
    color: lightColors.textSecondary,
    fontSize: font.sm,
    lineHeight: 19,
    marginTop: 8,
  },
  chevron: {
    color: lightColors.red,
    fontSize: 24,
    fontWeight: '400',
    width: 24,
    textAlign: 'center',
  },
  callCard: {
    alignItems: 'center',
    backgroundColor: '#FFF7F7',
    borderColor: 'rgba(204,34,34,0.14)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  callLabel: {
    color: lightColors.textSecondary,
    fontSize: font.xs,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  callTitle: {
    color: lightColors.textPrimary,
    fontSize: font.md,
    fontWeight: '700',
  },
  callAction: {
    color: lightColors.red,
    fontSize: font.md,
    fontWeight: '700',
  },
})
