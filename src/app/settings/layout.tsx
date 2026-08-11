// SPDX-License-Identifier: AGPL-3.0-or-later
import { SidebarInset } from '@/components/ui/sidebar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SidebarInset>{children}</SidebarInset>;
}
