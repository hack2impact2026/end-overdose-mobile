import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styles } from './styles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type ResourcesPage = 'home' | 'naloxone' | 'help' | 'nearby';

type ResourceOption = {
    id: Exclude<ResourcesPage, 'home'>;
    title: string;
    description: string;
    accent: string;
    symbol: React.ReactNode;
};

const resourceOptions: ResourceOption[] = [
    {
        id: 'help',
        title: 'Call for help',
        description: 'Connect to 911, poison control, or a crisis line',
        accent: '#1677ff',
        symbol: <Ionicons name="call-outline" size={32} color="white" />,
    },
    {
        id: 'naloxone',
        title: 'How to use naloxone',
        description: 'Step-by-step guide to administering Narcan',
        accent: '#34c759',
        symbol: <FontAwesome name="heartbeat" size={32} color="white" />,
    },
    {
        id: 'nearby',
        title: 'Find naloxone nearby',
        description: 'Locate the closest distribution point',
        accent: '#ff9f0a',
        symbol: <Feather name="map-pin" size={32} color="white" />,
    },
];

export default function ResourcesScreen() {
  const [page, setPage] = useState<ResourcesPage>('home');

  function AnimatedOption({ index, children }: { index: number; children: React.ReactNode }) {
    const progress = useSharedValue(0);

    useEffect(() => {
      progress.value = withDelay(
        index * 120,
        withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
      );
    }, [index]);

    const aStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: (1 - progress.value) * 18 }],
      opacity: progress.value,
    }));

    return <Animated.View style={aStyle}>{children}</Animated.View>;
  }

  if (page === 'naloxone') {
    return (
      <DetailScreen
        title="How to use naloxone"
        onBack={() => setPage('home')}
        stepItems={[
          'Lay the person flat on their back.',
          'Remove the cap and place the nozzle in one nostril.',
          'Press the plunger firmly to release the dose.',
          'Stay with them. If no response after 2-3 minutes, give a second dose.',
        ]}
      />
    );
  }

  if (page === 'help') {
    return (
      <DetailScreen
        title="Call for help"
        onBack={() => setPage('home')}
        contactItems={[
          { label: 'Emergency Services', value: '911', accent: '#1677ff', symbol: <Ionicons name="call-outline" size={24} color="white" /> },
          { label: 'Poison Control', value: '1-800-222-1222', accent: '#1677ff', symbol: <Ionicons name="call-outline" size={24} color="white" /> },
          { label: 'Suicide & Crisis Lifeline', value: '988', accent: '#1677ff', symbol: <Ionicons name="call-outline" size={24} color="white" /> },
        ]}
      />
    );
  }

  if (page === 'nearby') {
    return (
      <DetailScreen
        title="Find naloxone nearby"
        onBack={() => setPage('home')}
        contactItems={[
          { label: 'Festival Medical Tent', value: 'Open now', rightValue: '100 ft', accent: '#ff9f0a', symbol: <Feather name="map-pin" size={24} color="white" /> },
          { label: 'Community Health Center', value: 'Open until 10pm', rightValue: '200 ft', accent: '#ff9f0a', symbol: <Feather name="map-pin" size={24} color="white" /> },
          { label: 'Walgreens Pharmacy', value: 'Mon-Sat · 9am-9pm', rightValue: '1 mi', accent: '#ff9f0a', symbol: <Feather name="map-pin" size={24} color="white" /> },
        ]}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Resources
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Quick guides for right now
          </ThemedText>
        </View>

        <View style={styles.optionList}>
          {resourceOptions.map((option, i) => (
            <AnimatedOption index={i} key={option.id}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPage(option.id)}
                style={({ pressed }) => [styles.optionCard, pressed && styles.pressed]}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.accent }]}>
                  <ThemedText style={styles.optionIconText}>{option.symbol}</ThemedText>
                </View>

                <View style={styles.optionTextBlock}>
                  <ThemedText type="smallBold" style={styles.optionTitle}>
                    {option.title}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.optionDescription}>
                    {option.description}
                  </ThemedText>
                </View>

                <ThemedText themeColor="textSecondary" style={styles.chevron}>
                  ›
                </ThemedText>
              </Pressable>
            </AnimatedOption>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type DetailScreenProps = {
    title: string;
    onBack: () => void;
    stepItems?: string[];
    contactItems?: Array<{
        label: string;
        value: string;
        accent: string;
        symbol: React.ReactNode;
        rightValue?: string;
    }>;
};

function DetailScreen({ title, onBack, stepItems, contactItems }: DetailScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <ThemedText style={styles.backArrow}>←</ThemedText>
        </Pressable>

        <ThemedText type="subtitle" style={styles.detailTitle}>
          {title}
        </ThemedText>

        <View style={styles.detailList}>
          {stepItems?.map((item, index) => (
            <ThemedView key={item} type="backgroundElement" style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <ThemedText style={styles.stepBadgeText}>{index + 1}</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>{item}</ThemedText>
            </ThemedView>
          ))}

          {contactItems?.map((item) => (
            <ThemedView key={item.label} type="backgroundElement" style={styles.contactCard}>
              <View style={[styles.contactIcon, { backgroundColor: item.accent }]}>
                {item.symbol}
              </View>

              <View style={styles.contactBody}>
                <ThemedText type="smallBold" style={styles.contactLabel}>
                  {item.label}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.contactValue}>
                  {item.value}
                </ThemedText>
              </View>

              <View style={styles.contactRightSide}>
                {item.rightValue ? (
                  <ThemedText themeColor="textSecondary" style={styles.contactRightValue}>
                    {item.rightValue}
                  </ThemedText>
                ) : null}
                <ThemedText themeColor="textSecondary" style={styles.detailChevron}>
                  ›
                </ThemedText>
              </View>
            </ThemedView>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}