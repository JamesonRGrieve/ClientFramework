// SPDX-License-Identifier: AGPL-3.0-or-later
import { Team } from '@zephyrex/auth/management/Team';
import { TeamMembers } from '@zephyrex/auth/management/TeamMembers';
import type { ReactNode } from 'react';
import { SidebarPage } from '../../../../components/appwrapper/src/SidebarPage';
import { PageWithSlots } from '../../PageSlots';

export interface TeamPageProps {
  params: Promise<{ id?: string }>;
}

/**
 * Team management: the team switcher in the sidebar, members and invitations in the page. Mount as
 * `app/team/page.tsx` (the active team) and `app/team/[id]/page.tsx` (a named team).
 */
export async function TeamPage({ params }: TeamPageProps): Promise<ReactNode> {
  const { id } = await params;
  // Without a route id, both show the active team.
  const team = id === undefined ? {} : { teamId: id };
  return (
    <SidebarPage title='Team Management'>
      <PageWithSlots name='team' sidebar={<Team {...team} />} sidebarTitle='Team Details'>
        <div className='overflow-x-auto px-4'>
          <TeamMembers {...team} />
        </div>
      </PageWithSlots>
    </SidebarPage>
  );
}
