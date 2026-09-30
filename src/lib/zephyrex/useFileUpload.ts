// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback, useState } from 'react';
import { csrfHeaders } from '@zephyrex/auth';
import { useZephyrexConfig } from './ZephyrexProvider';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  [key: string]: unknown;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export function useFileUpload(endpoint?: string) {
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
                percent: Math.round((e.loaded / e.total) * 100),
              });
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
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
