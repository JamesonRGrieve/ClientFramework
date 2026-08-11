// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback, useState } from 'react';
import { getCookie } from 'cookies-next';
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
      const token = getCookie('jwt')?.toString();

      const formData = new FormData();
      formData.append('file', file);

      setUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percent: 0 });

      try {
        const xhr = new XMLHttpRequest();

        const result = await new Promise<UploadResult>((resolve, reject) => {
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

          xhr.open('POST', url);
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        });

        return result;
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
