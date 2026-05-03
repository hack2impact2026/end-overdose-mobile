import React from 'react';

import { EmergencyGuidedFlow } from '@/app/triage';

export default function Emergency911Screen() {
  return <EmergencyGuidedFlow initialStep="call-help" />;
}
