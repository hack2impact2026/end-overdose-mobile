import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const DOUBLE_TAP_DELAY = 300;

export function SOSEmergencyButton() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const lastTapRef = useRef(0);

  function handlePress() {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < DOUBLE_TAP_DELAY;

    if (isDoubleTap) {
      setIsModalVisible(true);
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Emergency Help</Text>
        <Text style={styles.subtitle}>Notify your trusted contacts immediately.</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="SOS emergency button"
          onPress={handlePress}
          style={({ pressed }) => [styles.buttonHitArea, pressed && styles.pressed]}
        >
          <View style={styles.outerRing}>
            <View style={styles.middleRing}>
              <View style={styles.innerButton}>
                <Text style={styles.sosText}>SOS</Text>
              </View>
            </View>
          </View>
        </Pressable>

        <Text style={styles.instruction}>Double-tap to confirm</Text>
      </View>

      <Text style={styles.footer}>
        This app coordinates support. It does not replace emergency services.
      </Text>

      <Modal
        animationType="slide"
        presentationStyle="fullScreen"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalScreen}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close emergency modal"
            onPress={() => setIsModalVisible(false)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.modalContent}>
            <Text style={styles.ambulance}>🚑</Text>
            <Text style={styles.modalTitle}>
              Take a deep breath{"\n"}
              EMS is on the way
            </Text>

            <Pressable style={styles.primaryAction} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.primaryActionText}>I NEED HELP</Text>
            </Pressable>

            <Pressable style={styles.secondaryAction} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.secondaryActionText}>I&apos;M READY TO HELP</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 22,
    color: '#777777',
    textAlign: 'center',
  },
  buttonHitArea: {
    marginTop: 84,
    marginBottom: 72,
  },
  pressed: {
    opacity: 0.9,
  },
  outerRing: {
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: '#fde3e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRing: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#f8b2b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerButton: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#e60026',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  instruction: {
    fontSize: 22,
    lineHeight: 28,
    color: '#707070',
    textAlign: 'center',
  },
  footer: {
    fontSize: 16,
    lineHeight: 21,
    color: '#b0b0b0',
    textAlign: 'center',
    maxWidth: 320,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: '#e60026',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '300',
    marginTop: -4,
  },
  modalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ambulance: {
    fontSize: 92,
    lineHeight: 92,
    marginBottom: 48,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 35,
    lineHeight: 42,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryAction: {
    marginTop: 52,
    width: '100%',
    maxWidth: 360,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  primaryActionText: {
    color: '#e60026',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  secondaryAction: {
    marginTop: 22,
    width: '100%',
    maxWidth: 360,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  secondaryActionText: {
    color: '#e60026',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
});