// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const aclRbacExtension: ZephyrexClientExtension = {
  name: 'acl_rbac',
  displayName: 'Role-Based Access Control',
  description: 'Role management and permission assignment',
  serverExtension: 'acl_rbac',
  managementTabs: [
    { id: 'roles', label: 'Roles', component: () => AutoSettingsPanel({ extensionName: 'Role Management' }), requireRole: 'superadmin', priority: 10 },
  ],
};
