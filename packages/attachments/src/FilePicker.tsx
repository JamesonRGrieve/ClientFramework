// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Upload as UploadIcon } from 'lucide-react';
import { type ChangeEvent, type ReactElement, useId, useRef, useState } from 'react';
import type { UploadProgress } from 'zephyrex';
import { Button } from 'zephyrex/ui/button';
import { Progress } from 'zephyrex/ui/progress';
import { ASSET_TYPES, uploadProblem } from './attachmentsModel';

export interface FilePickerProps {
  /** The button's words: "Add a picture", "Replace picture", "Add a file". */
  label: string;
  /** The media types it offers; the server's (pictures and PDFs) by default. */
  accept?: readonly string[];
  /** Takes the chosen file once it passes the server's checks; a rejection shows as the problem. */
  onFile: (file: File) => Promise<unknown>;
  /** Whether an upload is under way, and how far. */
  progress?: UploadProgress | null;
  uploading?: boolean;
  /** The last upload's failure. */
  error?: Error | null;
  disabled?: boolean;
}

/** A button that chooses a file, refuses what the server would, and shows the upload's progress. */
export function FilePicker({
  label,
  accept = ASSET_TYPES,
  onFile,
  progress = null,
  uploading = false,
  error = null,
  disabled = false,
}: FilePickerProps): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  const problemId = useId();
  const [refused, setRefused] = useState<string | null>(null);
  const problem = refused ?? error?.message ?? null;

  const chosen = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) {
      return;
    }
    const why = accept.includes(file.type) ? uploadProblem(file) : 'That kind of file can’t go here';
    setRefused(why);
    if (why !== null) {
      return;
    }
    try {
      await onFile(file);
    } catch (err) {
      setRefused(err instanceof Error ? err.message : 'The file could not be saved');
    }
  };

  return (
    <div className='grid min-w-0 gap-2'>
      <input
        ref={input}
        type='file'
        className='sr-only'
        tabIndex={-1}
        aria-hidden='true'
        accept={accept.join(',')}
        onChange={(event) => void chosen(event)}
      />
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={disabled || uploading}
        aria-describedby={problem === null ? undefined : problemId}
        onClick={() => input.current?.click()}
      >
        <UploadIcon aria-hidden='true' className='size-4' />
        {uploading ? 'Uploading…' : label}
      </Button>
      {uploading && progress !== null && <Progress value={progress.percent} aria-label={`${label}: uploading`} />}
      {problem !== null && (
        <p id={problemId} role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}
