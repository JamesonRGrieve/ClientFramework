import { Activity, AlertOctagon, Boxes, ListChecks, Workflow } from 'lucide-react';
import type { Item } from '@/app/NavMain';

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
    ],
  },
];
