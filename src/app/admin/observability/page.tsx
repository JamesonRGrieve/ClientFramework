// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ObservabilityStatus } from '@zephyrex/observability';
import type { JSX } from 'react';
import { SidebarPage } from 'zephyrex/components/appwrapper/src/SidebarPage';

export default function ObservabilityPage(): JSX.Element {
  return (
    <SidebarPage title='Observability'>
      <ObservabilityStatus />
    </SidebarPage>
  );
}
