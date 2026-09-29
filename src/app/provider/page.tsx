// SPDX-License-Identifier: AGPL-3.0-or-later
import { ProviderSidebar } from './[id]/providerSideBar';
import ProviderInstances from './[id]/providers';
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { PageWithSlots } from '@/lib/zephyrex/PageSlots';

export default function ProviderPage() {
  return (
    <SidebarPage title='Provider Management'>
      <PageWithSlots name='provider' sidebar={<ProviderSidebar />} sidebarTitle='Provider Instance Details'>
        <div className='overflow-x-auto px-4'>
          <ProviderInstances />
        </div>
      </PageWithSlots>
    </SidebarPage>
  );
}
