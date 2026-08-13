// SPDX-License-Identifier: AGPL-3.0-or-later
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { SidebarContent } from '@/components/appwrapper/src/SidebarContentManager';
import { Team } from '@zephyrex/auth/management/Team';
import { Team as TeamUsers } from '@zephyrex/auth/management/TeamUsers';

export default function TeamPage() {
  return (
    <SidebarPage title='Team Management'>
      <div className='overflow-x-auto px-4'>
        <TeamUsers />
      </div>
      <SidebarContent title='Team Details'>
        <Team />
      </SidebarContent>
    </SidebarPage>
  );
}
