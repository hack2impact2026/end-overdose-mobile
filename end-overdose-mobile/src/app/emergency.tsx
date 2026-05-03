import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SOSEmergencyButton } from '@/components/sos-emergency-button';
import { TabBar } from '@/constants/theme';

export default function EmergencyScreen() {
  const router = useRouter();
  const [armed, setArmed] = useState(false);

  function handleConfirmed() {
    setArmed(false);
    router.navigate('/emergency-active');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Help</Text>
        <Text style={styles.subtitle}>Emergency contact simulation active.</Text>
      </View>

      <View style={styles.center}>
        <SOSEmergencyButton onConfirmed={handleConfirmed} onArmedChange={setArmed} />
        <Text style={[styles.instruction, armed && styles.instructionArmed]}>
          {armed ? 'Tap again to confirm' : 'Double-tap to confirm'}
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: TabBar.height + 16 }]}>
        <Text style={styles.disclaimer}>
          Demo emergency mode. In a real emergency, call 911 immediately.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    fontFamily: 'System',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#6E6E73',
    textAlign: 'center',
    fontFamily: 'System',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    marginTop: 32,
    fontSize: 17,
    color: '#6E6E73',
    textAlign: 'center',
    fontFamily: 'System',
  },
  instructionArmed: {
    color: '#E60023',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  disclaimer: {
    fontSize: 12,
    color: '#AEAEB2',
    textAlign: 'center',
    fontFamily: 'System',
  },
});
