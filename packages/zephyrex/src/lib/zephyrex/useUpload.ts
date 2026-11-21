// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { csrfHeaders } from '@zephyrex/auth';
import { useCallback, useState } from 'react';
import type { z } from 'zod';
import { isSuccessStatus } from '../api/httpStatus';
import { useZephyrexConfig } from './ZephyrexProvider';

const PERCENT = 100;

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/** Where and how a file goes up, and what the server must answer. Keep it stable (a module constant or `useMemo`). */
export interface UploadRequest<T> {
  /** The server path, after the configured base URL, query string included. */
  path: (file: File) => string;
  /** What is sent: the file in a form, or the file's own bytes. */
  body: (file: File) => XMLHttpRequestBodyInit;
  /** Headers besides the CSRF token, such as the file's `Content-Type` when its bytes go as they are. */
  headers?: (file: File) => Readonly<Record<string, string>>;
  /** What a successful answer must be. */
  answer: z.ZodType<T>;
}

export interface Upload<T> {
  /** Uploads a file; resolves to the server's answer, or null when the upload failed (see `error`). */
  upload: (file: File) => Promise<T | null>;
  uploading: boolean;
  progress: UploadProgress | null;
  error: Error | null;
}

/** Sends one request with upload progress: the session cookie rides along, the write carries the CSRF token. */
async function send<T>(
  url: string,
  file: File,
  request: UploadRequest<T>,
  onProgress: (progress: UploadProgress) => void,
): Promise<T> {
  const xhr = new XMLHttpRequest();
  const responseText = await new Promise<string>((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress({ loaded: e.loaded, total: e.total, percent: Math.round((e.loaded / e.total) * PERCENT) });
      }
    });
    xhr.addEventListener('load', () => {
      if (isSuccessStatus(xhr.status)) {
        resolve(xhr.responseText);
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed: network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    xhr.open('POST', url);
    const headers = { ...request.headers?.(file), ...csrfHeaders('POST') };
    for (const [header, value] of Object.entries(headers)) {
      xhr.setRequestHeader(header, value);
    }
    xhr.send(request.body(file));
  });
  const answered = request.answer.safeParse(JSON.parse(responseText));
  if (!answered.success) {
    throw new Error('Upload failed: the server’s answer was not an upload result');
  }
  return answered.data;
}

/** Uploads files as `request` says, with progress and the last error. */
export function useUpload<T>(request: UploadRequest<T>): Upload<T> {
  const { config } = useZephyrexConfig();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File): Promise<T | null> => {
      setUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percent: 0 });
      try {
        return await send(`${config.server.baseUrl}${request.path(file)}`, file, request, setProgress);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setUploading(false);
      }
    },
    [config.server.baseUrl, request],
  );

  return { upload, uploading, progress, error };
}
