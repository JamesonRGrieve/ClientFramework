import type { ReactNode } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  return <SidebarInset>{children}</SidebarInset>;
}
