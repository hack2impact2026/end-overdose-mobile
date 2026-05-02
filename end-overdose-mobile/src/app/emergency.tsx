import { SafeAreaView } from 'react-native-safe-area-context';
import { SOSEmergencyButton } from '@/components/sos-emergency-button';

export default function EmergencyScreen() {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white', paddingTop: 20, paddingHorizontal: 20}}>
      <SOSEmergencyButton />
    </SafeAreaView>
  );
}
