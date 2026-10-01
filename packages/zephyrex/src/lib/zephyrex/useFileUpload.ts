// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { csrfHeaders } from '@zephyrex/auth';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { isSuccessStatus } from '../api/httpStatus';
import { useZephyrexConfig } from './ZephyrexProvider';

const PERCENT = 100;

/** What the file endpoint answers an upload with; other fields it sends pass through. */
const UploadResultSchema = z.looseObject({
  url: z.string(),
  filename: z.string(),
  size: z.number(),
});

export type UploadResult = z.infer<typeof UploadResultSchema>;

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface FileUpload {
  /** Uploads a file; resolves to what the server stored, or null when the upload failed (see `error`). */
  upload: (file: File) => Promise<UploadResult | null>;
  uploading: boolean;
  progress: UploadProgress | null;
  error: Error | null;
}

export function useFileUpload(endpoint?: string): FileUpload {
  const { config } = useZephyrexConfig();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      const url = `${config.server.baseUrl}${endpoint ?? '/v1/file'}`;

      const formData = new FormData();
      formData.append('file', file);

      setUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percent: 0 });

      try {
        const xhr = new XMLHttpRequest();

        return await new Promise<UploadResult>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgress({
                loaded: e.loaded,
                total: e.total,
                percent: Math.round((e.loaded / e.total) * PERCENT),
              });
            }
          });

          xhr.addEventListener('load', () => {
            if (!isSuccessStatus(xhr.status)) {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
              return;
            }
            const stored = UploadResultSchema.safeParse(JSON.parse(xhr.responseText));
            if (stored.success) {
              resolve(stored.data);
            } else {
              reject(new Error('Upload failed: the server’s answer was not an upload result'));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Upload failed: network error')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

          // Same-origin: the session cookie rides along; the write carries the CSRF token.
          xhr.open('POST', url);
          for (const [header, value] of Object.entries(csrfHeaders('POST'))) {
            xhr.setRequestHeader(header, value);
          }
          xhr.send(formData);
        });
      } catch (err) {
        const uploadError = err instanceof Error ? err : new Error(String(err));
        setError(uploadError);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [config.server.baseUrl, endpoint],
  );

  return { upload, uploading, progress, error };
}
