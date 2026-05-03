import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    homeContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 24,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        color: '#1c1c1e',
    },
    subtitle: {
        marginTop: 8,
        fontSize: 17,
        lineHeight: 24,
    },
    optionList: {
        gap: 18,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 24,
        backgroundColor: '#ffffff',
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
    },
    pressed: {
        opacity: 0.86,
    },
    optionIcon: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 18,
    },
    optionIconText: {
        color: '#ffffff',
        fontSize: 34,
        fontWeight: '700',
        lineHeight: 36,
    },
    optionTextBlock: {
        flex: 1,
    },
    optionTitle: {
        color: '#1c1c1e',
        fontSize: 24,
        lineHeight: 30,
    },
    optionDescription: {
        marginTop: 6,
        fontSize: 16,
        lineHeight: 22,
    },
    chevron: {
        fontSize: 42,
        lineHeight: 42,
        marginLeft: 10,
    },
    detailContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 28,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f2f2f7',
        marginBottom: 14,
    },
    backArrow: {
        fontSize: 24,
        lineHeight: 24,
        color: '#1c1c1e',
    },
    detailTitle: {
        color: '#1c1c1e',
        fontSize: 26,
        lineHeight: 32,
        marginBottom: 20,
    },
    detailList: {
        gap: 14,
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
    },
    stepBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#34c759',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    stepBadgeText: {
        color: '#ffffff',
        fontSize: 18,
        lineHeight: 20,
        fontWeight: '700',
    },
    stepText: {
        flex: 1,
        fontSize: 18,
        lineHeight: 25,
        color: '#1c1c1e',
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
    },
    contactIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    contactIconText: {
        color: '#ffffff',
        fontSize: 22,
        lineHeight: 22,
        fontWeight: '700',
    },
    contactBody: {
        flex: 1,
    },
    contactLabel: {
        color: '#1c1c1e',
        fontSize: 18,
        lineHeight: 24,
    },
    contactValue: {
        marginTop: 2,
        fontSize: 16,
        lineHeight: 22,
    },
    contactRightSide: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    contactRightValue: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 2,
    },
    detailChevron: {
        fontSize: 34,
        lineHeight: 34,
    },
});