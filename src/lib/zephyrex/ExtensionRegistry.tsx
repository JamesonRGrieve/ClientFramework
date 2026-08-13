// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useMemo } from 'react';
import type { ZephyrexClientExtension } from './types';
import { useServerExtensions } from './hooks';

export function useActiveExtensions(registeredExtensions: ZephyrexClientExtension[]): {
  active: ZephyrexClientExtension[];
  loading: boolean;
} {
  const { data: serverExtensions, isLoading } = useServerExtensions();

  const active = useMemo(() => {
    if (!serverExtensions) return registeredExtensions;
    const serverNames = new Set(serverExtensions.map((e) => e.name));
    return registeredExtensions.filter((ext) => !ext.serverExtension || serverNames.has(ext.serverExtension));
  }, [registeredExtensions, serverExtensions]);

  return { active, loading: isLoading };
}

export function AutoSettingsPanel({ extensionName }: { extensionName: string }) {
  return (
    <div className='p-4'>
      <h3 className='text-lg font-semibold mb-2'>{extensionName} Settings</h3>
      <p className='text-sm text-muted-foreground'>Configure {extensionName} via the server API settings endpoint.</p>
    </div>
  );
}
