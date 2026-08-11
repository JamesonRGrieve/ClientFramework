// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { ReactNode } from 'react';
import { useRole } from '../hooks';

export function RequireRole({
  role,
  children,
  fallback = null,
}: {
  role: 'admin' | 'superadmin';
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAdmin, isSuperAdmin } = useRole();

  if (role === 'superadmin' && !isSuperAdmin) return <>{fallback}</>;
  if (role === 'admin' && !isAdmin) return <>{fallback}</>;

  return <>{children}</>;
}
