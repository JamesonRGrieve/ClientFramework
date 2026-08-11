// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const aclRbacExtension: ZephyrexClientExtension = {
  name: 'acl_rbac',
  displayName: 'Role-Based Access Control',
  description: 'Role management and permission assignment',
  serverExtension: 'acl_rbac',
  // Role management is handled via the /v1/role API.
  // The RequireRole component from zephyrex gates UI based on roles.
  // Admin UI for role CRUD could be added as a settings panel.
};
