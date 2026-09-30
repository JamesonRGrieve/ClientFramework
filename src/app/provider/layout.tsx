'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';

export default function ProviderLayout({ children }: { children: ReactNode }): ReactNode {
  return <SidebarInset>{children}</SidebarInset>;
}
