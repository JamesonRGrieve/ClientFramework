// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { type ReactElement, useState } from 'react';
import { useClient } from 'zephyrex';
import { Avatar, AvatarFallback, AvatarImage } from 'zephyrex/ui/avatar';
import { Button } from 'zephyrex/ui/button';
import { LoadProblem } from 'zephyrex/ui/load-problem';
import { Skeleton } from 'zephyrex/ui/skeleton';
import { useAttachmentActions, useAttachments } from './attachmentsApi';
import { assetContentPath, type Attachment, newestIn, PRIMARY_IMAGE, type RecordRef } from './attachmentsModel';
import { FilePicker } from './FilePicker';

const PICTURE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
/** The large picture's width and height in CSS pixels (max-w-48). */
const PICTURE_PX = 192;

export interface RecordPictureProps {
  /** The record whose picture this is. */
  target: RecordRef;
  /** The record's name: the picture's alternative text, and the initials when there is none. */
  name: string;
  /** Whether the user may change it (the server checks again). */
  canEdit?: boolean;
  /** The role it takes; a record's own picture by default. */
  role?: string;
  /** `lg` for the record's page, `sm` for a row in a list. */
  size?: 'sm' | 'lg';
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

/** A record's picture: the newest in its role, with add, replace and remove for someone who may edit it. */
export function RecordPicture({
  target,
  name,
  canEdit = false,
  role = PRIMARY_IMAGE,
  size = 'lg',
}: RecordPictureProps): ReactElement {
  const client = useClient();
  const pictures = useAttachments(target, role);
  const current = newestIn(pictures.data ?? [], role);
  const src = current === null ? null : client.url(assetContentPath(current.asset_id));

  if (size === 'sm') {
    return (
      <Avatar className='size-10'>
        {src !== null && <AvatarImage src={src} alt={name} className='object-cover' />}
        <AvatarFallback role='img' aria-label={name}>
          {initialsOf(name)}
        </AvatarFallback>
      </Avatar>
    );
  }
  return (
    <figure className='grid w-full max-w-48 gap-3'>
      {pictures.isLoading ? (
        <Skeleton role='status' aria-label='Loading the picture' className='aspect-square w-full' />
      ) : pictures.error !== undefined ? (
        <LoadProblem what='the picture' error={pictures.error} onRetry={async () => pictures.mutate()} />
      ) : src === null ? (
        <div className='flex aspect-square w-full items-center justify-center rounded-lg border border-dashed bg-muted text-muted-foreground'>
          <ImageIcon aria-hidden='true' className='size-8' />
          <span className='sr-only'>{`No picture of ${name} yet`}</span>
        </div>
      ) : (
        // unoptimized: the content route needs the viewer's session, which Next's image optimizer doesn't carry.
        <NextImage
          src={src}
          alt={name}
          width={PICTURE_PX}
          height={PICTURE_PX}
          unoptimized
          className='aspect-square w-full rounded-lg border object-cover'
        />
      )}
      {canEdit && <PictureControls target={target} role={role} current={current} previous={pictures.data ?? []} />}
    </figure>
  );
}

interface PictureControlsProps {
  target: RecordRef;
  role: string;
  /** The picture shown now, if any. */
  current: Attachment | null;
  /** Every attachment in the role, replaced together. */
  previous: readonly Attachment[];
}

function PictureControls({ target, role, current, previous }: PictureControlsProps): ReactElement {
  const actions = useAttachmentActions(target);
  const [removeProblem, setRemoveProblem] = useState<string | null>(null);
  const remove = async (attachment: Attachment): Promise<void> => {
    setRemoveProblem(null);
    try {
      await actions.remove(attachment);
    } catch (err) {
      setRemoveProblem(err instanceof Error ? err.message : 'The picture could not be removed');
    }
  };
  return (
    <figcaption className='grid gap-2'>
      <FilePicker
        label={current === null ? 'Add a picture' : 'Replace picture'}
        accept={PICTURE_TYPES}
        onFile={async (file) => actions.replaceFile(file, role, previous)}
        uploading={actions.upload.uploading}
        progress={actions.upload.progress}
        error={actions.upload.error}
      />
      {current !== null && (
        <Button type='button' variant='ghost' size='sm' onClick={() => void remove(current)}>
          Remove picture
        </Button>
      )}
      {removeProblem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {removeProblem}
        </p>
      )}
    </figcaption>
  );
}
