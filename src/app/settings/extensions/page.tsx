// SPDX-License-Identifier: AGPL-3.0-or-later
import { SidebarPage } from '@jgrieve/appwrapper/SidebarPage';
import { Extensions } from '@/components/settings/extensions';

export default function ExtensionsPage() {
  return (
    <SidebarPage title='Extensions'>
      <Extensions />
    </SidebarPage>
  );
}
