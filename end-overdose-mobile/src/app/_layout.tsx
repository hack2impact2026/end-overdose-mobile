import { Tabs } from 'expo-router';
import React from 'react';

import CustomTabBar from '@/components/custom-tab-bar';

export default function RootLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="emergency" options={{ title: 'Emergency' }} />
      <Tabs.Screen name="resources" options={{ title: 'Resources' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="emergency-active" options={{ href: null, title: '' }} />
      <Tabs.Screen name="triage" options={{ href: null, title: '' }} />
      <Tabs.Screen name="emergency-911" options={{ href: null, title: '' }} />
    </Tabs>
  );
}
