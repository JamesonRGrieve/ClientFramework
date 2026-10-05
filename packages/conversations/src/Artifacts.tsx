// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { ReactElement } from 'react';
import { type Artifact, useArtifacts } from './artifactsApi';
import { shownTime } from './display';
import { Problem } from './Problem';

const BYTES_PER_KIB = 1024;

/** A file size as people read it: bytes, KiB or MiB. */
export function sizeLabel(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) {
    return '';
  }
  if (bytes < BYTES_PER_KIB) {
    return `${String(bytes)} B`;
  }
  const kib = bytes / BYTES_PER_KIB;
  return kib < BYTES_PER_KIB ? `${kib.toFixed(1)} KiB` : `${(kib / BYTES_PER_KIB).toFixed(1)} MiB`;
}

/** What is known of a file besides its name: type, size and when it was kept. */
const detailsOf = (artifact: Artifact): string =>
  [artifact.mime_type ?? '', sizeLabel(artifact.file_size), shownTime(artifact.created_at)]
    .filter((part) => part !== '')
    .join(' · ');

/** A conversation's files, each with its text when the server holds it (an encrypted file's is not shown). */
export function Artifacts({ conversationId }: { conversationId: string }): ReactElement {
  const { data: artifacts = [], error, isLoading } = useArtifacts(conversationId);

  return (
    <div className='grid gap-3'>
      {error !== undefined && <Problem text={`The files could not be loaded: ${error.message}`} />}
      {error === undefined && artifacts.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'No files yet.'}</p>
      )}
      {artifacts.length > 0 && (
        <ul aria-label='Files' className='divide-y rounded-md border'>
          {artifacts.map((artifact) => (
            <li key={artifact.id} className='grid gap-1 px-4 py-3 text-sm'>
              <span className='font-medium'>{artifact.name ?? artifact.relative_path}</span>
              <span className='text-xs text-muted-foreground'>{detailsOf(artifact)}</span>
              {artifact.encrypted ? (
                <span className='text-xs text-muted-foreground'>Encrypted: its content is not shown.</span>
              ) : (
                (artifact.content ?? '') !== '' && (
                  <details>
                    <summary className='cursor-pointer text-xs'>Show content</summary>
                    <pre className='mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs'>
                      {artifact.content}
                    </pre>
                  </details>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
