// SPDX-License-Identifier: AGPL-3.0-or-later
import { Activity, AlertOctagon, Boxes, Gauge, KeyRound, ListChecks, Vault, Workflow } from 'lucide-react';
import type { Item } from '@zephyrex/auth/NavMenu';

export const adminNavItems: Item[] = [
  {
    title: 'Operations',
    icon: Activity,
    items: [
      { title: 'Health', url: '/admin/health', icon: Activity },
      { title: 'DLQ', url: '/admin/dlq', icon: AlertOctagon },
      { title: 'Services', url: '/admin/services', icon: ListChecks },
      { title: 'Rotations', url: '/admin/rotations', icon: Workflow },
      { title: 'Extensions', url: '/admin/extensions', icon: Boxes },
      { title: 'Root Providers', url: '/admin/providers', icon: KeyRound },
      { title: 'Secret Vault', url: '/admin/secret-vault', icon: Vault },
      { title: 'Observability', url: '/admin/observability', icon: Gauge },
    ],
  },
];
