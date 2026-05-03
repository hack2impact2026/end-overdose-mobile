import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from '@/constants/theme';

const PIN_SIZE = 40;

const CONTACTS = [
  { name: 'Mom', initial: 'M', color: '#FF3B30', top: '28%', left: '22%' },
  { name: 'Alex', initial: 'A', color: '#007AFF', top: '40%', left: '68%' },
  { name: 'Sam', initial: 'S', color: '#34C759', top: '62%', left: '38%' },
];

const GRID_LINES = 7;
const USER = { name: 'You', initial: 'YO', email: 'you@example.com', color: '#007AFF' };

function GridLines() {
  return (
    <>
      {Array.from({ length: GRID_LINES }).map((_, i) => (
        <View
          key={`h${i}`}
          style={[
            styles.gridLine,
            {
              top: `${((i + 1) / (GRID_LINES + 1)) * 100}%`,
              left: 0,
              right: 0,
              height: StyleSheet.hairlineWidth,
            },
          ]}
        />
      ))}
      {Array.from({ length: GRID_LINES }).map((_, i) => (
        <View
          key={`v${i}`}
          style={[
            styles.gridLine,
            {
              left: `${((i + 1) / (GRID_LINES + 1)) * 100}%`,
              top: 0,
              bottom: 0,
              width: StyleSheet.hairlineWidth,
            },
          ]}
        />
      ))}
      <View style={[styles.curveLine, styles.curveLineTop]} />
      <View style={[styles.curveLine, styles.curveLineMiddle]} />
      <View style={[styles.curveLine, styles.curveLineBottom]} />
    </>
  );
}

function ContactPin({
  name,
  initial,
  color,
  top,
  left,
}: {
  name: string;
  initial: string;
  color: string;
  top: string;
  left: string;
}) {
  return (
    <View style={[styles.pin, { top, left }]}>
      <View style={[styles.pinCircle, { backgroundColor: color }]}>
        <Text style={styles.pinInitial}>{initial}</Text>
      </View>
      <Text style={styles.pinLabel}>{name}</Text>
    </View>
  );
}

function UserPin() {
  return (
    <View style={styles.userPin}>
      <View style={styles.userArrow} />
    </View>
  );
}

function AddContactIcon() {
  return (
    <View style={styles.addIcon}>
      <View style={styles.addIconHead} />
      <View style={styles.addIconBody} />
      <View style={styles.addIconPlusHorizontal} />
      <View style={styles.addIconPlusVertical} />
    </View>
  );
}

function ContactSheet({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={[styles.sheetAvatar, { backgroundColor: USER.color }]}>
            <Text style={styles.sheetAvatarText}>{USER.initial}</Text>
          </View>

          <View style={styles.sheetHeaderText}>
            <Text style={styles.sheetTitle}>You</Text>
            <Text style={styles.sheetSubtitle}>{USER.email}</Text>
          </View>
        </View>

        <Text style={styles.sheetSectionTitle}>Safety circle</Text>

        <View style={styles.contactRow}>
          {CONTACTS.map((contact) => (
            <View key={contact.name} style={[styles.contactChip, { backgroundColor: contact.color }]}>
              <Text style={styles.contactChipText}>{contact.initial}</Text>
            </View>
          ))}

          <Pressable style={styles.addChip}>
            <Text style={styles.addChipText}>+</Text>
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </>
  );
}

export default function ProfileScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.mapContainer}>
        <GridLines />

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Group</Text>
            <Text style={styles.headerSubtitle}>Your trusted contacts</Text>
          </View>

          <Pressable style={styles.addContactButton} onPress={() => setSheetOpen(true)}>
            <AddContactIcon />
          </Pressable>
        </View>

        {CONTACTS.map((c) => (
          <ContactPin
            key={c.name}
            name={c.name}
            initial={c.initial}
            color={c.color}
            top={c.top}
            left={c.left}
          />
        ))}

        <UserPin />

        <View style={[styles.statusCard, { bottom: TabBar.height + 24 }]}>
          <View style={styles.greenDot} />
          <Text style={styles.statusText}>You are safe.</Text>
        </View>

        {sheetOpen ? <ContactSheet onClose={() => setSheetOpen(false)} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#F8F8FA',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    top: 32,
    left: 24,
    right: 24,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'System',
  },
  headerSubtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
    color: '#6E6E73',
    fontFamily: 'System',
  },
  addContactButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#E5E5EA',
  },
  curveLine: {
    position: 'absolute',
    left: -40,
    right: -40,
    height: 48,
    borderTopWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 999,
    opacity: 0.8,
  },
  curveLineTop: {
    top: '11%',
    transform: [{ rotate: '3deg' }],
  },
  curveLineMiddle: {
    top: '34%',
    transform: [{ rotate: '-2deg' }],
  },
  curveLineBottom: {
    top: '67%',
    transform: [{ rotate: '2deg' }],
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -PIN_SIZE / 2 }],
  },
  pinCircle: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pinInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  pinLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#111111',
    fontFamily: 'System',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  userPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  statusCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 10,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    fontFamily: 'System',
  },
  addIcon: {
    width: 28,
    height: 28,
    position: 'relative',
  },
  addIconHead: {
    position: 'absolute',
    top: 2,
    left: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.2,
    borderColor: '#6E6E73',
    backgroundColor: 'transparent',
  },
  addIconBody: {
    position: 'absolute',
    top: 14,
    left: 2,
    width: 16,
    height: 8,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2.2,
    borderBottomWidth: 0,
    borderColor: '#6E6E73',
    backgroundColor: 'transparent',
  },
  addIconPlusHorizontal: {
    position: 'absolute',
    top: 9,
    right: 1,
    width: 9,
    height: 2.2,
    borderRadius: 2,
    backgroundColor: '#6E6E73',
  },
  addIconPlusVertical: {
    position: 'absolute',
    top: 5.5,
    right: 4.4,
    width: 2.2,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#6E6E73',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.16)',
    zIndex: 4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TabBar.height,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 42,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    zIndex: 5,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 76,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#D9D9DF',
    marginBottom: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  sheetAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'System',
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#6E6E73',
    fontFamily: 'System',
  },
  sheetSectionTitle: {
    marginTop: 32,
    fontSize: 18,
    fontWeight: '500',
    color: '#6E6E73',
    fontFamily: 'System',
  },
  contactRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactChip: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactChipText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  addChip: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D1D6',
    backgroundColor: '#FFFFFF',
  },
  addChipText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '400',
    color: '#6E6E73',
    fontFamily: 'System',
  },
  logoutButton: {
    marginTop: 40,
    alignSelf: 'flex-start',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FF3B30',
    fontFamily: 'System',
  },
});
