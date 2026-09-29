// SPDX-License-Identifier: AGPL-3.0-or-later
import { Team } from '@zephyrex/auth/management/Team';
import { Team as TeamUsers } from '@zephyrex/auth/management/TeamUsers';
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { PageWithSlots } from '@/lib/zephyrex/PageSlots';

export default function TeamPage() {
  return (
    <SidebarPage title='Team Management'>
      <PageWithSlots name='team' sidebar={<Team />} sidebarTitle='Team Details'>
        <div className='overflow-x-auto px-4'>
          <TeamUsers />
        </div>
      </PageWithSlots>
    </SidebarPage>
  );
}
