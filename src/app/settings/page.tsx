// SPDX-License-Identifier: AGPL-3.0-or-later
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { SidebarContent } from '@/components/appwrapper/src/SidebarContentManager';
import { Providers } from '@/components/settings/providers';

export default function ProvidersPage() {
  return (
    <SidebarPage title='Settings'>
      <SidebarContent title='Settings'>
        <div></div>
      </SidebarContent>
      <Providers />
    </SidebarPage>
  );
}
