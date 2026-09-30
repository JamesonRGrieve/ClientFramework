// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { AuthServerProvider } from '@zephyrex/auth';
import { type ReactNode, useMemo } from 'react';
import { SWRConfig } from 'swr';
import { configureApiClient } from '../api/client';
import { SidebarProvider } from '../../components/ui/sidebar';
import { Toaster } from '../../components/ui/toaster';
import { TooltipProvider } from '../../components/ui/tooltip';
import { SidebarContentProvider } from '../../components/appwrapper/src/SidebarContentManager';
import { RateLimitBanner } from './components/RateLimitBanner';
import { ManagementTabProvider } from './ManagementTabRegistry';
import type { ZephyrexConfig } from './types';
import { useRateLimit } from './useRateLimit';
import { ZephyrexProvider } from './ZephyrexProvider';

/** Any data hook that hits a rate limit puts up the banner until the server's Retry-After passes. */
function RateLimitBoundary({ children }: { children: ReactNode }): ReactNode {
  const { isLimited, remainingMs, reportError: report } = useRateLimit();
  return (
    <SWRConfig value={{ onError: report }}>
      {isLimited && <RateLimitBanner remainingMs={remainingMs} />}
      {children}
    </SWRConfig>
  );
}

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
                <RateLimitBoundary>{children}</RateLimitBoundary>
                <Toaster />
              </SidebarProvider>
            </SidebarContentProvider>
          </TooltipProvider>
        </ManagementTabProvider>
      </ZephyrexProvider>
    </AuthServerProvider>
  );
}
