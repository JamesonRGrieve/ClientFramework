import { SidebarPage } from '@jgrieve/appwrapper/SidebarPage';
import { Extensions } from '@/components/settings/extensions';

export default function ExtensionsPage() {
  return (
    <SidebarPage title='Extensions'>
      <Extensions />
    </SidebarPage>
  );
}
