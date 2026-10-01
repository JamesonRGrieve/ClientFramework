'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import type React from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const YOUTUBE_ID_LENGTH = 11;

const getYoutubeId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?(?<id>[^#&?]*).*/;
  const id = url.match(regExp)?.groups?.['id'];
  return id?.length === YOUTUBE_ID_LENGTH ? id : null;
};

type MarkdownLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export default function MarkdownLink({ children, href, className, ...props }: MarkdownLinkProps): ReactNode {
  const isExternal = href !== undefined && href !== '' && !href.startsWith('#');
  const youtubeId = href === undefined ? null : getYoutubeId(href);
  if (youtubeId !== null) {
    return (
      <div className='w-96'>
        <div className='relative w-full aspect-video'>
          <iframe
            title={youtubeId}
            className='absolute top-0 left-0 w-full h-full'
            src={`https://www.youtube.com/embed/${youtubeId}`}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <a
      href={href}
      className={cn('underline hover:no-underline', className)}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  );
}
