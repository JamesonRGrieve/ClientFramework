// SPDX-License-Identifier: AGPL-3.0-or-later
import ProviderSidebar from './providerSideBar';
import ProviderInstances from './providers';
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { SidebarContent } from '@/components/appwrapper/src/SidebarContentManager';

export default function TeamPage() {
  return (
    <SidebarPage title='Provider Management'>
      <div className='overflow-x-auto px-4'>
        <ProviderInstances />
      </div>
      <SidebarContent title='Provider Instance Details'>
        <ProviderSidebar />
      </SidebarContent>
    </SidebarPage>
  );
}
