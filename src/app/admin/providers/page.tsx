// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX } from 'react';
import { RootProviderStatus } from 'zephyrex';
import { SidebarPage } from 'zephyrex/components/appwrapper/src/SidebarPage';

export default function RootProvidersPage(): JSX.Element {
  return (
    <SidebarPage title='Root Providers'>
      <RootProviderStatus />
    </SidebarPage>
  );
}
