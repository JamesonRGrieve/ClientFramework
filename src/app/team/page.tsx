import { SidebarPage } from '@jgrieve/appwrapper/SidebarPage';
import { SidebarContent } from '@/components/appwrapper/src/SidebarContentManager';
import Team from '@jgrieve/auth/management/Team';
import TeamUsers from '@jgrieve/auth/management/TeamUsers';

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
