import { SidebarInset } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  return <SidebarInset>{children}</SidebarInset>;
}
