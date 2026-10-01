'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Renders under a Zephyrex config with a request cache of its own, for tests of components and
 * hooks that need the Zephyrex providers. Published as `zephyrex/testing`.
 */
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { ZephyrexApp, type ZephyrexConfig } from '@/lib/zephyrex';

const testConfig: ZephyrexConfig = {
  server: { baseUrl: 'http://localhost:1996' },
  app: { name: 'Test App', defaultTheme: 'dark' },
  auth: { privateRoutes: ['/team'] },
};

export function TestWrapper({ children, config }: { children: ReactNode; config?: Partial<ZephyrexConfig> }) {
  const mergedConfig = {
    ...testConfig,
    ...config,
    server: { ...testConfig.server, ...config?.server },
    app: { ...testConfig.app, ...config?.app },
  };

  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ZephyrexApp config={mergedConfig}>{children}</ZephyrexApp>
    </SWRConfig>
  );
}

/** A `wrapper` for renderHook that renders under `config` instead of the default test config. */
export function wrapperWith(config: Partial<ZephyrexConfig>): (props: { children: ReactNode }) => ReactNode {
  return function ConfiguredTestWrapper({ children }: { children: ReactNode }) {
    return <TestWrapper config={config}>{children}</TestWrapper>;
  };
}

export { testConfig };
