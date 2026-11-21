// SPDX-License-Identifier: AGPL-3.0-or-later
import NextImage from 'next/image.js';
import type { ReactNode } from 'react';

export interface ImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export default function MarkdownImage({ src, alt, className, ...props }: ImageProps): ReactNode {
  if (src === undefined || src === '') {
    return null;
  }

  // Only this app's own files (the API is served on its origin) go through Next's optimiser;
  // anything remote is shown as-is rather than proxied, so it needs no remotePatterns, and with no
  // Referer, so a host that blocks hotlinking (a fandom or wiki image) still serves it.
  const sameOrigin = src.startsWith('/') && !src.startsWith('//');

  return (
    <div className={`relative w-full h-80 ${className ?? ''}`} {...props}>
      <NextImage
        src={src}
        alt={alt ?? ''}
        fill
        className='object-contain object-left-center'
        unoptimized={!sameOrigin}
        referrerPolicy='no-referrer'
      />
    </div>
  );
}
