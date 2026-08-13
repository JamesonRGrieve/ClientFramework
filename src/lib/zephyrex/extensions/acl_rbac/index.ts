// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { AutoSettingsPanel } from '../../ExtensionRegistry';

export const aclRbacExtension = createExtension('acl_rbac', {
  displayName: 'Role-Based Access Control',
  description: 'Role management and permission assignment',
  managementTabs: [
    {
      id: 'roles',
      label: 'Roles',
      component: () => AutoSettingsPanel({ extensionName: 'Role Management' }),
      requireRole: 'superadmin',
      priority: 10,
    },
  ],
});
