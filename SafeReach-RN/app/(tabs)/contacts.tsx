import { useState } from 'react'
import {
  Image,
  ImageSourcePropType,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { font, lightColors, radius } from '../../src/theme'

const guideImages = {
  narcan: require('../../assets/images/guides/narcan-guide.png'),
  breathing: require('../../assets/images/guides/breathing-guide.png'),
  call911: require('../../assets/images/guides/call-911-guide.png'),
}

type GuideStep = { type: 'step'; text: string }
type GuideScript = { type: 'script'; quote: string; bullets: string[] }
type GuideItem = GuideStep | GuideScript

interface Guide {
  id: string
  title: string
  subtitle: string
  modalTitle: string
  modalSubtitle: string
  image?: ImageSourcePropType
  items: GuideItem[]
}

const GUIDES: Guide[] = [
  {
    id: 'narcan',
    title: 'Administer Narcan 💉',
    subtitle: 'Give naloxone as soon as possible',
    modalTitle: 'Administer Narcan',
    modalSubtitle: 'Give naloxone now.',
    image: guideImages.narcan,
    items: [
      { type: 'step', text: 'Lay on back' },
      { type: 'step', text: 'Spray in nostril' },
      { type: 'step', text: 'Call 911' },
      { type: 'step', text: 'Wait 2–3 min' },
      { type: 'step', text: 'Give another dose if needed' },
      { type: 'step', text: 'Stay with them' },
    ],
  },
  {
    id: 'breathing',
    title: 'Support Breathing 🫁',
    subtitle: 'Rescue breathing and CPR guidance',
    modalTitle: 'Support Breathing',
    modalSubtitle: 'Help them breathe.',
    image: guideImages.breathing,
    items: [
      { type: 'step', text: 'Check breathing' },
      { type: 'step', text: 'Tilt head back' },
      { type: 'step', text: 'Lift chin' },
      { type: 'step', text: 'Give breaths if trained' },
      { type: 'step', text: 'CPR if no pulse' },
      { type: 'step', text: 'Stay with them' },
    ],
  },
  {
    id: 'call911',
    title: 'What to Say to 911 📞',
    subtitle: 'Simple emergency call script',
    modalTitle: 'What to Say to 911',
    modalSubtitle: 'Say this clearly.',
    image: guideImages.call911,
    items: [
      {
        type: 'script',
        quote: '"Possible overdose. Not breathing normally. Need help now."',
        bullets: [
          'Give your location',
          'Say if Narcan was given',
          'Stay on the line',
        ],
      },
    ],
  },
]

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets()
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)

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
          <Text style={s.subtitle}>Emergency guides for overdose response</Text>
        </View>

        {/* Emergency Call 911 Card */}
        <View style={s.emergencyCard}>
          <View style={s.emergencyContent}>
            <Text style={s.emergencyLabel}>NEED URGENT HELP?</Text>
            <Text style={s.emergencyTitle}>Call 911</Text>
            <Text style={s.emergencyBody}>
              Unresponsive or not breathing normally? Call now.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL('tel:911')}
            style={({ pressed }) => [
              s.emergencyButton,
              pressed && s.pressed,
            ]}
          >
            <Text style={s.emergencyButtonText}>Call</Text>
          </Pressable>
        </View>

        {/* Critical Guides Section */}
        <View style={s.guideSection}>
          <Text style={s.sectionTitle}>Critical Guides</Text>
        </View>

        <View style={s.guidesList}>
          {GUIDES.map((guide) => (
            <Pressable
              key={guide.id}
              accessibilityRole="button"
              onPress={() => setSelectedGuide(guide)}
              style={({ pressed }) => [
                s.guideCard,
                pressed && s.pressed,
              ]}
            >
              <View style={s.guideContent}>
                <View style={s.guideTextWrap}>
                  <Text style={s.guideTitle}>{guide.title}</Text>
                  <Text style={s.guideSubtitle}>{guide.subtitle}</Text>
                </View>
                <Text style={s.guideArrow}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Guide Modal */}
      <Modal
        visible={selectedGuide !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGuide(null)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setSelectedGuide(null)}
        >
          <Pressable style={s.modalCard} onPress={() => {}}>
            {/* Close button — sits outside ScrollView so it's always visible */}
            <Pressable
              style={s.closeButton}
              onPress={() => setSelectedGuide(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
            >
              <Text style={s.closeIcon}>✕</Text>
            </Pressable>

            {selectedGuide && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={s.modalScroll}
              >
                <Text style={s.modalTitle}>{selectedGuide.modalTitle}</Text>
                <Text style={s.modalSubtitle}>{selectedGuide.modalSubtitle}</Text>

                {selectedGuide.image && (
                  <Image
                    source={selectedGuide.image}
                    style={s.guideImage}
                    resizeMode="contain"
                  />
                )}

                <View style={s.itemsList}>
                  {selectedGuide.items.map((item, idx) => {
                    if (item.type === 'step') {
                      return (
                        <View key={idx} style={s.stepRow}>
                          <View style={s.stepBadge}>
                            <Text style={s.stepNumber}>{idx + 1}</Text>
                          </View>
                          <Text style={s.stepText}>{item.text}</Text>
                        </View>
                      )
                    }
                    return (
                      <View key={idx}>
                        <View style={s.scriptBox}>
                          <Text style={s.scriptQuote}>{item.quote}</Text>
                        </View>
                        <View style={s.bulletsList}>
                          {item.bullets.map((bullet, bi) => (
                            <View key={bi} style={s.bulletRow}>
                              <Text style={s.bulletDot}>•</Text>
                              <Text style={s.bulletText}>{bullet}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )
                  })}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  emergencyCard: {
    backgroundColor: '#FFF5F5',
    borderColor: 'rgba(220, 38, 38, 0.18)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 22,
    marginBottom: 32,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyLabel: {
    color: 'rgba(185, 28, 28, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  emergencyTitle: {
    color: lightColors.red,
    fontSize: font.lg,
    fontWeight: '700',
    marginBottom: 6,
  },
  emergencyBody: {
    color: lightColors.textSecondary,
    fontSize: font.sm,
    lineHeight: 18,
  },
  emergencyButton: {
    backgroundColor: lightColors.red,
    borderRadius: 999,
    minHeight: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  guideSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: lightColors.textPrimary,
    fontSize: font.xl,
    fontWeight: '700',
  },
  guidesList: {
    gap: 14,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(204,34,34,0.35)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  guideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    gap: 16,
  },
  guideTextWrap: {
    flex: 1,
  },
  guideTitle: {
    color: lightColors.textPrimary,
    fontSize: font.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  guideSubtitle: {
    color: lightColors.red,
    fontSize: font.sm,
    fontWeight: '600',
  },
  guideArrow: {
    color: lightColors.red,
    fontSize: 40,
    fontWeight: '600',
    marginLeft: 12,
    lineHeight: 44,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalScroll: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  guideImage: {
    width: 240,
    height: 160,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeIcon: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
  modalTitle: {
    color: lightColors.textPrimary,
    fontSize: font['2xl'] ?? 24,
    fontWeight: '800',
    marginBottom: 6,
    marginRight: 40,
  },
  modalSubtitle: {
    color: lightColors.red,
    fontSize: font.md,
    fontWeight: '600',
    marginBottom: 24,
  },
  itemsList: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: lightColors.red,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
  },
  stepText: {
    color: lightColors.textPrimary,
    fontSize: font.lg,
    fontWeight: '600',
    flex: 1,
  },
  scriptBox: {
    backgroundColor: '#FFF7F7',
    borderColor: 'rgba(204,34,34,0.2)',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 20,
  },
  scriptQuote: {
    color: lightColors.textPrimary,
    fontSize: font.lg,
    fontWeight: '700',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  bulletsList: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    color: lightColors.red,
    fontSize: font.xl,
    lineHeight: 26,
    fontWeight: '700',
  },
  bulletText: {
    color: lightColors.textPrimary,
    fontSize: font.lg,
    fontWeight: '600',
    flex: 1,
    lineHeight: 26,
  },
})
