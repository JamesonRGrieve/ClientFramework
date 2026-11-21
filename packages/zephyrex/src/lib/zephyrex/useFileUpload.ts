// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useMemo } from 'react';
import { z } from 'zod';
import { type Upload, type UploadRequest, useUpload } from './useUpload';

export type { UploadProgress } from './useUpload';

/** What the file endpoint answers an upload with; other fields it sends pass through. */
const UploadResultSchema = z.looseObject({
  url: z.string(),
  filename: z.string(),
  size: z.number(),
});

export type UploadResult = z.infer<typeof UploadResultSchema>;

export type FileUpload = Upload<UploadResult>;

/** Uploads a file as a form field (`file`) to the fileio endpoint, or `endpoint`. */
export function useFileUpload(endpoint?: string): FileUpload {
  const request = useMemo<UploadRequest<UploadResult>>(
    () => ({
      path: (): string => endpoint ?? '/v1/file',
      body: (file): FormData => {
        const formData = new FormData();
        formData.append('file', file);
        return formData;
      },
      answer: UploadResultSchema,
    }),
    [endpoint],
  );
  return useUpload(request);
}
