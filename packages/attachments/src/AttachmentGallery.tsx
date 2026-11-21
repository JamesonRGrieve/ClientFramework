// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { FileText, X } from 'lucide-react';
import NextImage from 'next/image';
import { type ReactElement, useState } from 'react';
import { useClient } from 'zephyrex';
import { Button } from 'zephyrex/ui/button';
import { LoadProblem } from 'zephyrex/ui/load-problem';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { useAttachmentActions, useAttachments } from './attachmentsApi';
import { assetContentPath, type Attachment, fileSize, GALLERY, isPicture, type RecordRef } from './attachmentsModel';
import { FilePicker } from './FilePicker';

/** A thumbnail's width and height in CSS pixels. */
const THUMB_PX = 96;

export interface AttachmentGalleryProps {
  /** The record whose files these are. */
  target: RecordRef;
  /** The role they take; a record's gallery by default. */
  role?: string;
  /** Whether the user may add and remove them (the server checks again). */
  canEdit?: boolean;
  /** Names the section for screen readers, and the add button ("Add to Files"). */
  label?: string;
}

/** The record's pictures as thumbnails and its other files (PDFs) as links, with add and remove for an editor. */
export function AttachmentGallery({
  target,
  role = GALLERY,
  canEdit = false,
  label = 'Files',
}: AttachmentGalleryProps): ReactElement {
  const client = useClient();
  const files = useAttachments(target, role);
  const rows = files.data ?? [];
  const pictures = rows.filter((one) => one.asset !== undefined && isPicture(one.asset.content_type));
  const documents = rows.filter((one) => !pictures.includes(one));
  const src = (one: Attachment): string => client.url(assetContentPath(one.asset_id));

  return (
    <section aria-label={label} className='grid min-w-0 gap-3'>
      {files.isLoading ? (
        <SkeletonRows rows={2} />
      ) : files.error !== undefined ? (
        <LoadProblem what={label.toLowerCase()} error={files.error} onRetry={async () => files.mutate()} />
      ) : rows.length === 0 ? (
        <p className='text-sm text-muted-foreground'>Nothing here yet.</p>
      ) : (
        <>
          {pictures.length > 0 && (
            <ul aria-label='Pictures' className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
              {pictures.map((one) => (
                <li key={one.id} className='relative min-w-0'>
                  <a href={src(one)} target='_blank' rel='noopener noreferrer'>
                    <NextImage
                      src={src(one)}
                      alt={one.asset?.name ?? 'Picture'}
                      width={THUMB_PX}
                      height={THUMB_PX}
                      unoptimized
                      className='aspect-square w-full rounded-md border object-cover'
                    />
                  </a>
                  {canEdit && <RemoveButton target={target} attachment={one} overlay />}
                </li>
              ))}
            </ul>
          )}
          {documents.length > 0 && (
            <ul aria-label='Documents' className='grid gap-1'>
              {documents.map((one) => (
                <li key={one.id} className='flex min-w-0 items-center gap-2'>
                  <FileText aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
                  <a
                    href={src(one)}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='min-w-0 flex-1 truncate text-sm underline-offset-4 [contain:inline-size] hover:underline'
                  >
                    {one.asset?.name ?? 'File'}
                  </a>
                  {one.asset !== undefined && (
                    <span className='shrink-0 text-xs text-muted-foreground'>{fileSize(one.asset.size)}</span>
                  )}
                  {canEdit && <RemoveButton target={target} attachment={one} />}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {canEdit && <AddFile target={target} role={role} label={label} />}
    </section>
  );
}

function AddFile({ target, role, label }: { target: RecordRef; role: string; label: string }): ReactElement {
  const actions = useAttachmentActions(target);
  return (
    <FilePicker
      label={`Add to ${label}`}
      onFile={async (file) => actions.attachFile(file, role)}
      uploading={actions.upload.uploading}
      progress={actions.upload.progress}
      error={actions.upload.error}
    />
  );
}

interface RemoveButtonProps {
  target: RecordRef;
  attachment: Attachment;
  /** Over a thumbnail's corner, rather than at the end of a row. */
  overlay?: boolean;
}

function RemoveButton({ target, attachment, overlay = false }: RemoveButtonProps): ReactElement {
  const actions = useAttachmentActions(target);
  const [problem, setProblem] = useState<string | null>(null);
  const name = attachment.asset?.name ?? 'this file';
  const remove = async (): Promise<void> => {
    setProblem(null);
    try {
      await actions.remove(attachment);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'It could not be removed');
    }
  };
  return (
    <>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        aria-label={`Remove ${name}`}
        className={overlay ? 'absolute right-1 top-1 size-7 bg-background/80' : 'size-7 shrink-0'}
        onClick={() => void remove()}
      >
        <X aria-hidden='true' className='size-4' />
      </Button>
      {problem !== null && (
        <p role='alert' className='text-xs text-destructive'>
          {problem}
        </p>
      )}
    </>
  );
}
