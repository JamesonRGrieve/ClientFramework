import { Activity, AlertOctagon, Boxes, KeyRound, ListChecks, Workflow } from 'lucide-react';
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
    ],
  },
];
