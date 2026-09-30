'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';
import { SidebarPage } from '../../../../components/appwrapper/src/SidebarPage';
import MarkdownBlock from '../../../../components/markdown/MarkdownBlock';
import { useZephyrexConfig } from '../../ZephyrexProvider';

/** Points readers at the server's generated REST reference (`<server>/redoc`). */
export function ApiReferencePage(): ReactNode {
  const { config } = useZephyrexConfig();
  return (
    <SidebarPage title='API Reference'>
      <MarkdownBlock content={`See our [REST API Documentation](${config.server.baseUrl}/redoc) for more information.`} />
    </SidebarPage>
  );
}
