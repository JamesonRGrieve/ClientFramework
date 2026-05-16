'use client';

import type { ReactNode } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';

export default function TeamLayout({ children }: { children: ReactNode }): ReactNode {
  return <SidebarInset>{children}</SidebarInset>;
}
