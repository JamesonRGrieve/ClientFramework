// SPDX-License-Identifier: AGPL-3.0-or-later
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { Extensions } from '@/components/settings/extensions';

export default function ExtensionsPage() {
  return (
    <SidebarPage title='Extensions'>
      <Extensions />
    </SidebarPage>
  );
}
