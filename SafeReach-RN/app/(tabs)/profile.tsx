import React, { useMemo, useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Pressable,
	Modal,
	TouchableOpacity,
	Linking,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Switch } from 'react-native'
import { lightColors, font, radius } from '../../src/theme'
import { useApp } from '../../src/AppContext'

const VOLUNTEER_DEFAULT_LOCATION = { label: '34°4\'14"N 118°27\'1"W' }

export default function ProfileScreen() {
	const insets = useSafeAreaInsets()
	const { userName, alertSettings, setAlertSettings } = useApp()
	const firstName = useMemo(() => (userName || 'Samantha').split(' ')[0], [userName])
  const lastName = useMemo(() => (userName || 'Schnitzel').split(' ')[0], [userName])

	// Demo profile data; in a real app this would come from persisted user profile
	const [profile] = useState({
		certifiedVolunteer: true,
		phone: '(415) 555-0123',
		email: 'you@example.com',
		height: "5'6\"",
		weight: '150 lb',
		gender: 'Female',
		age: 32,
		medicationHistory: 'None',
		primaryLanguage: 'English',
		needsInterpreter: false,
		interpreterLanguage: '',
		insurance: 'Medicare',
	})

	const contacts = [
		{ id: 'mom', name: 'Mom', phone: '(555) 111-0101' },
		{ id: 'dad', name: 'Dad', phone: '(555) 222-0202' },
		{ id: 'sister', name: 'Sister', phone: '(555) 333-0303' },
		{ id: 'brother', name: 'Brother', phone: '(555) 444-0404' },
	]

	const [showContactsModal, setShowContactsModal] = useState(false)
	const [showAlertsModal, setShowAlertsModal] = useState(false)

	// Local copies to immediately reflect UI while persisting through context
	const [localAlerts, setLocalAlerts] = useState(() => ({
		alertEMS: alertSettings?.alertEMS ?? true,
		alertContacts: alertSettings?.alertContacts ?? true,
		alertVolunteers: alertSettings?.alertVolunteers ?? true,
		shareVolunteerLocation: alertSettings?.shareVolunteerLocation ?? false,
	}))
	const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)

	return (
		<View style={[s.screen, { paddingTop: insets.top }]}>
			<ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
				<View style={s.header}>
					<View style={s.avatar} accessibilityRole="image" accessibilityLabel="Profile avatar">
						<Text style={s.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
					</View>
					<View style={s.nameRow}>
					<Text style={s.nameText}>{firstName} {lastName}</Text>
						{profile.certifiedVolunteer ? (
							<View style={s.verified} accessibilityLabel="Verified volunteer">
								<Text style={s.verifiedText}>✓</Text>
							</View>
						) : null}
					</View>
				</View>

				<View style={s.actions}>
					<Pressable
						onPress={() => setShowContactsModal(true)}
						accessibilityRole="button"
						style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
					>
						<Text style={s.actionLabel}>Update Close Contacts</Text>
						<Text style={s.actionSub}>Add or edit friends & family</Text>
					</Pressable>

					<Pressable
						onPress={() => setShowAlertsModal(true)}
						accessibilityRole="button"
						style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
					>
						<Text style={s.actionLabel}>Alert Settings</Text>
						<Text style={s.actionSub}>Manage how alerts are sent</Text>
					</Pressable>
				</View>

				<View style={s.section}>
					<Text style={s.sectionTitle}>Contact</Text>
					<View style={s.row}><Text style={s.label}>Phone</Text><Text style={s.value}>{profile.phone}</Text></View>
					<View style={s.row}><Text style={s.label}>Email</Text><Text style={s.value}>{profile.email}</Text></View>
				</View>

				<View style={s.section}>
					<Text style={s.sectionTitle}>Health</Text>
					<View style={s.row}><Text style={s.label}>Height</Text><Text style={s.value}>{profile.height}</Text></View>
					<View style={s.row}><Text style={s.label}>Weight</Text><Text style={s.value}>{profile.weight}</Text></View>
					<View style={s.row}><Text style={s.label}>Gender</Text><Text style={s.value}>{profile.gender}</Text></View>
					<View style={s.row}><Text style={s.label}>Age</Text><Text style={s.value}>{profile.age}</Text></View>
					<View style={s.row}><Text style={s.label}>Medication history</Text><Text style={s.value}>{profile.medicationHistory}</Text></View>
					<View style={s.row}><Text style={s.label}>Primary language</Text><Text style={s.value}>{profile.primaryLanguage}</Text></View>
					<View style={s.row}><Text style={s.label}>Needs interpreter</Text><Text style={s.value}>{profile.needsInterpreter ? 'Yes' : 'No'}</Text></View>
					{profile.needsInterpreter ? (
						<View style={s.row}><Text style={s.label}>Interpreter language</Text><Text style={s.value}>{profile.interpreterLanguage}</Text></View>
					) : null}
					<View style={s.row}><Text style={s.label}>Insurance</Text><Text style={s.value}>{profile.insurance}</Text></View>
				</View>

        				{profile.certifiedVolunteer ? (
					<View style={s.section}>
						<Text style={s.sectionTitle}>Volunteer Location</Text>
						<View style={s.toggleRow}>
							<View style={s.toggleCopyWrap}>
								<Text style={s.toggleLabel}>Share location with help requests</Text>
							</View>
							<Switch
								value={localAlerts.shareVolunteerLocation}
								onValueChange={(v) => {
									const next = { ...localAlerts, shareVolunteerLocation: v }
									setLocalAlerts(next)
									setAlertSettings(next)
								}}
								trackColor={{ false: '#d1d1d1', true: RED }}
								thumbColor={'#fff'}
							/>
						</View>
					</View>
				) : null}

				<View style={{ height: 40 }} />
			</ScrollView>

			{/* Contacts modal */}
			<Modal visible={showContactsModal} animationType="slide" onRequestClose={() => setShowContactsModal(false)}>
				<View style={[s.modalWrap, { paddingTop: insets.top + 16 }] }>
					<Text style={s.modalTitle}>Update Close Contacts</Text>
					<Text style={s.modalCopy}>Tap to call or edit your trusted contacts.</Text>

						<View style={{ marginTop: 8, gap: 10 }}>
							{contacts.map(c => (
								<View key={c.id} style={s.contactBlock}>
									<View style={s.contactTextWrap}>
										<Text style={s.contactName}>{c.name}</Text>
										<Text style={s.contactPhone}>{c.phone}</Text>
									</View>
									<TouchableOpacity
										style={s.contactCallBtn}
										onPress={() => Linking.openURL(`tel:${c.phone.replace(/[^0-9+]/g, '')}`)}
									>
										<Ionicons name="call" size={20} color={RED} />
									</TouchableOpacity>
								</View>
							))}
						</View>

					<TouchableOpacity onPress={() => setShowContactsModal(false)} style={s.modalClose}>
						<Text style={s.modalCloseText}>Close</Text>
					</TouchableOpacity>
				</View>
			</Modal>

			{/* Alerts modal */}
			<Modal visible={showAlertsModal} animationType="slide" onRequestClose={() => setShowAlertsModal(false)}>
					<View style={[s.modalWrap, { paddingTop: insets.top + 16 }] }>
						<Text style={s.modalTitle}>Alert Settings</Text>
						<Text style={s.modalCopy}>Select who should be notified when you start an emergency.</Text>

						<View style={s.toggleRow}>
							<Text style={s.toggleLabel}>Alert EMS</Text>
							<Switch
								value={localAlerts.alertEMS}
								onValueChange={(v) => setLocalAlerts(prev => ({ ...prev, alertEMS: v }))}
								trackColor={{ false: '#d1d1d1', true: RED }}
								thumbColor={'#fff'}
							/>
						</View>

						<View style={s.toggleRow}>
							<Text style={s.toggleLabel}>Alert close contacts</Text>
							<Switch
								value={localAlerts.alertContacts}
								onValueChange={(v) => setLocalAlerts(prev => ({ ...prev, alertContacts: v }))}
								trackColor={{ false: '#d1d1d1', true: RED }}
								thumbColor={'#fff'}
							/>
						</View>

						<View style={s.toggleRow}>
							<Text style={s.toggleLabel}>Alert volunteers</Text>
							<Switch
								value={localAlerts.alertVolunteers}
								onValueChange={(v) => setLocalAlerts(prev => ({ ...prev, alertVolunteers: v }))}
								trackColor={{ false: '#d1d1d1', true: RED }}
								thumbColor={'#fff'}
							/>
						</View>

						<TouchableOpacity
							onPress={() => {
								setAlertSettings && setAlertSettings(localAlerts)
								setShowAlertsModal(false)
							}}
							style={[s.modalClose, { marginTop: 18 }]}
						>
							<Text style={s.modalCloseText}>Save</Text>
						</TouchableOpacity>
					</View>
			</Modal>
		</View>
	)
}

const RED = '#CC2222'
const RED_SOFT = 'rgba(204,34,34,0.08)'
const RED_BORDER = 'rgba(204,34,34,0.14)'
const RED_GLOW = 'rgba(204,34,34,0.10)'

const s = StyleSheet.create({
	screen: { flex: 1, backgroundColor: '#FFFFFF' },
	content: { paddingHorizontal: 20, paddingTop: 20 },
	header: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
	avatar: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: RED_SOFT,
		borderColor: RED_BORDER,
		borderWidth: 2,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	avatarInitial: { color: RED, fontSize: font['3xl'], fontWeight: '700' },
	nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	nameText: { color: RED, fontSize: font.xl, fontWeight: '700' },
	verified: {
		backgroundColor: lightColors.greenSoft,
		borderRadius: radius.full,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	verifiedText: { color: lightColors.green, fontWeight: '700' },
	actions: { gap: 12, marginBottom: 16 },
	actionBtn: {
		backgroundColor: RED_SOFT,
		borderColor: RED_BORDER,
		borderWidth: 1,
		borderRadius: radius.lg,
		padding: 14,
	},
	actionLabel: { color: RED, fontSize: font.md, fontWeight: '700' },
	actionSub: { color: lightColors.textSecondary, fontSize: font.sm, marginTop: 4 },
	pressed: { opacity: 0.7 },
	section: { marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: RED_BORDER },
	sectionTitle: { color: RED, fontSize: font.lg, fontWeight: '700', marginBottom: 8 },
	row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 0 },
	label: { color: lightColors.textSecondary, fontSize: font.sm },
	value: { color: lightColors.textPrimary, fontSize: font.md, fontWeight: '600' },
	modalWrap: { flex: 1, padding: 28, backgroundColor: lightColors.bg },
	modalTitle: { fontSize: 24, fontWeight: '700', color: lightColors.textPrimary, marginBottom: 8 },
	modalCopy: { color: lightColors.textSecondary, fontSize: font.md, marginBottom: 20 },
	modalClose: { marginTop: 'auto', backgroundColor: lightColors.surface, padding: 14, borderRadius: radius.md, alignItems: 'center' },
	modalCloseText: { color: lightColors.textPrimary, fontWeight: '700' },
	contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: lightColors.border ?? '#eee' },
	contactName: { fontSize: font.md, color: lightColors.textPrimary, fontWeight: '600' },
	contactPhone: { fontSize: font.md, color: lightColors.textSecondary },
	contactBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: radius.md, backgroundColor: lightColors.surface, borderWidth: 1, borderColor: lightColors.border ?? '#eee' },
	contactTextWrap: { flex: 1, paddingRight: 12 },
	contactCallBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
	toggleCopyWrap: { flex: 1, paddingRight: 12 },
	toggleSub: { marginTop: 4, fontSize: font.sm, color: lightColors.textSecondary, lineHeight: 18 },
	dropdownWrap: { marginTop: 10 },
	dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: lightColors.surface, borderWidth: 1, borderColor: lightColors.border ?? '#eee' },
	dropdownTextWrap: { flex: 1, paddingRight: 12 },
	dropdownValue: { marginTop: 4, fontSize: font.sm, color: lightColors.textSecondary },
	dropdownChevron: { fontSize: font.lg, color: lightColors.textSecondary },
	dropdownMenu: { marginTop: 8, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: lightColors.border ?? '#eee', backgroundColor: lightColors.bg },
	dropdownItem: { paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: lightColors.border ?? '#eee' },
	dropdownItemText: { fontSize: font.md, color: lightColors.textPrimary },
		toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: lightColors.border ?? '#eee' },
		toggleLabel: { fontSize: font.md, color: lightColors.textPrimary, fontWeight: '600' },
})

