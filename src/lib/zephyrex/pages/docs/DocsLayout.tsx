// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';
import { SidebarInset } from '../../../../components/ui/sidebar';

/** Layout for the /docs routes (mount as `app/docs/layout.tsx`). */
export function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <SidebarInset>
      <div className='p-4'>{children}</div>
    </SidebarInset>
  );
}
