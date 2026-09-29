// SPDX-License-Identifier: AGPL-3.0-or-later
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { Providers } from '@/components/settings/providers';
import { PageWithSlots } from '@/lib/zephyrex/PageSlots';

export default function SettingsPage() {
  return (
    <SidebarPage title='Settings'>
      <PageWithSlots name='settings' sidebarTitle='Settings'>
        <Providers />
      </PageWithSlots>
    </SidebarPage>
  );
}
