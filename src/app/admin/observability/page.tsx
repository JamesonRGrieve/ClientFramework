// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX } from 'react';
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { ObservabilityStatus } from '@/lib/zephyrex/components/ObservabilityStatus';

export default function ObservabilityPage(): JSX.Element {
  return (
    <SidebarPage title='Observability'>
      <ObservabilityStatus />
    </SidebarPage>
  );
}
