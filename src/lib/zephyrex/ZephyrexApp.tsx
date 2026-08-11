// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { ReactNode } from 'react';
import { SidebarProvider } from '../../components/ui/sidebar';
import { Toaster } from '../../components/ui/toaster';
import { TooltipProvider } from '../../components/ui/tooltip';
import { SidebarContentProvider } from '../../components/appwrapper/src/SidebarContentManager';
import type { ZephyrexConfig } from './types';
import { ZephyrexProvider } from './ZephyrexProvider';

export function ZephyrexApp({
  config,
  children,
}: {
  config: ZephyrexConfig;
  children: ReactNode;
}) {
  return (
    <ZephyrexProvider config={config}>
      <TooltipProvider>
        <SidebarContentProvider>
          <SidebarProvider>
            {children}
            <Toaster />
          </SidebarProvider>
        </SidebarContentProvider>
      </TooltipProvider>
    </ZephyrexProvider>
  );
}
