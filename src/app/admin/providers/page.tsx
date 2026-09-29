// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX } from 'react';
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { RootProviderStatus } from '@/lib/zephyrex/components/RootProviderStatus';

export default function RootProvidersPage(): JSX.Element {
  return (
    <SidebarPage title='Root Providers'>
      <RootProviderStatus />
    </SidebarPage>
  );
}
