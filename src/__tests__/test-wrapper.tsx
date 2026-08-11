// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { ZephyrexApp } from '@/lib/zephyrex';
import type { ZephyrexConfig } from '@/lib/zephyrex';

const testConfig: ZephyrexConfig = {
  server: { baseUrl: 'http://localhost:1996' },
  app: { name: 'Test App', defaultTheme: 'dark' },
  auth: { privateRoutes: ['/settings'] },
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
      <ZephyrexApp config={mergedConfig}>
        {children}
      </ZephyrexApp>
    </SWRConfig>
  );
}

export { testConfig };
