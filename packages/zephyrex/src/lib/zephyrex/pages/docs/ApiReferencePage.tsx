'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';
import useSWR from 'swr';
import { SidebarPage } from '../../../../components/appwrapper/src/SidebarPage';
import MarkdownBlock from '../../../../components/markdown/MarkdownBlock';
import { useZephyrexConfig } from '../../ZephyrexProvider';

/** Whether the server publishes its REST reference: its OpenAPI document answers. */
async function published(openApi: string): Promise<boolean> {
  try {
    return (await fetch(openApi, { method: 'HEAD' })).ok;
  } catch {
    // No server (a lite app), or one that refuses the request: nothing to link to.
    return false;
  }
}

/**
 * Points readers at the server's generated REST reference (`<server>/redoc`), when the server
 * publishes it. Production servers keep it private unless `EXPOSE_DOCS=true`, and a lite app has no
 * server, so the link appears only once the OpenAPI document is known to answer.
 */
export function ApiReferencePage(): ReactNode {
  const { config } = useZephyrexConfig();
  const server = config.server.baseUrl;
  const docs = useSWR(['api-reference', server], async () => published(`${server}/openapi.json`), {
    revalidateOnFocus: false,
  });
  return (
    <SidebarPage title='API Reference'>
      <div className='grid gap-3'>
        <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>API reference</h1>
        {docs.data === true && (
          <MarkdownBlock content={`See our [REST API Documentation](${server}/redoc) for more information.`} />
        )}
        {docs.data === false && <p className='text-muted-foreground'>This server doesn’t publish its REST reference.</p>}
      </div>
    </SidebarPage>
  );
}
