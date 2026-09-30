// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { formatByteSize } from '../../byte-size';
import { useClient } from '../hooks';
import { sdkDownloadPath, useSdks } from '../useSdks';

const LANGUAGE_NAMES: Record<string, string> = { python: 'Python', typescript: 'TypeScript', rust: 'Rust' };

const languageName = (language: string): string => LANGUAGE_NAMES[language] ?? language;

/** The client SDKs this server has generated, each downloadable as a zip with its checksum to verify it by. */
export function SdkDownloads(): JSX.Element {
  const client = useClient();
  const { data: sdks, error } = useSdks();

  let body: JSX.Element;
  if (error !== undefined) {
    body = <p className='text-sm text-destructive'>Failed to load the client SDKs.</p>;
  } else if (sdks === undefined) {
    body = <p className='text-sm text-muted-foreground'>Loading…</p>;
  } else if (sdks.length === 0) {
    body = <p className='text-sm text-muted-foreground'>This server has not generated any client SDKs.</p>;
  } else {
    body = (
      <Table aria-label='Client SDKs'>
        <TableHeader>
          <TableRow>
            <TableHead>Language</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>SHA-256</TableHead>
            <TableHead>
              <span className='sr-only'>Download</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sdks.map((sdk) => (
            <TableRow key={sdk.language}>
              <TableCell>{languageName(sdk.language)}</TableCell>
              <TableCell className='font-mono'>{sdk.version}</TableCell>
              <TableCell>{formatByteSize(sdk.size)}</TableCell>
              <TableCell className='max-w-48 break-all font-mono text-xs'>{sdk.sha256}</TableCell>
              <TableCell>
                <a
                  href={client.url(sdkDownloadPath(sdk.language))}
                  download={sdk.filename}
                  aria-label={`Download the ${languageName(sdk.language)} SDK`}
                  className='text-sm font-medium underline underline-offset-4'
                >
                  Download
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client SDKs</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
