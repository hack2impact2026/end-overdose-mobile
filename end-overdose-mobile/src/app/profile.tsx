import { useState } from 'react';
import { Alert, Button, ScrollView, Text } from 'react-native';

import { supabase } from '@/lib/supabaseClient';
import { signInAnonymouslyAndEnsureProfile, signOut } from '@/services/auth';

export default function ProfileScreen() {
  const [result, setResult] = useState<unknown>(null);

  async function testSelectProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').limit(5);

    if (error) {
      Alert.alert('Select failed', error.message);
      return;
    }

    setResult(data);
    Alert.alert('Success', `Selected ${data.length} profile rows.`);
  }

  async function testAnonymousProfile() {
    try {
      const user = await signInAnonymouslyAndEnsureProfile();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setResult(data);
      Alert.alert('Success', 'Anonymous profile created/found.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Auth/profile test failed', message);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setResult(null);
      Alert.alert('Signed out');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Sign out failed', message);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: '800' }}>
        Supabase Test
      </Text>

      <Button title="Test Select Profiles" onPress={testSelectProfiles} />
      <Button title="Test Anonymous Profile" onPress={testAnonymousProfile} />
      <Button title="Sign Out" onPress={handleSignOut} />

      <Text selectable>{JSON.stringify(result, null, 2)}</Text>
    </ScrollView>
  );
}