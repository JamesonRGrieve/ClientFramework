// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { AuthServerProvider } from '@zephyrex/auth';
import { type ReactNode, useMemo } from 'react';
import { configureApiClient } from '../api/client';
import { SidebarProvider } from '../../components/ui/sidebar';
import { Toaster } from '../../components/ui/toaster';
import { TooltipProvider } from '../../components/ui/tooltip';
import { SidebarContentProvider } from '../../components/appwrapper/src/SidebarContentManager';
import { ManagementTabProvider } from './ManagementTabRegistry';
import type { ZephyrexConfig } from './types';
import { ZephyrexProvider } from './ZephyrexProvider';

export function ZephyrexApp({ config, children }: { config: ZephyrexConfig; children: ReactNode }) {
  const extensions = config.extensions ?? [];
  // Configured during render, before any child's first request, so every call uses the app's API base.
  useMemo(() => configureApiClient({ baseUrl: config.server.baseUrl }), [config.server.baseUrl]);

  return (
    <AuthServerProvider baseUrl={config.server.baseUrl}>
      <ZephyrexProvider config={config}>
        <ManagementTabProvider extensions={extensions}>
          <TooltipProvider>
            <SidebarContentProvider>
              <SidebarProvider>
                {children}
                <Toaster />
              </SidebarProvider>
            </SidebarContentProvider>
          </TooltipProvider>
        </ManagementTabProvider>
      </ZephyrexProvider>
    </AuthServerProvider>
  );
}
