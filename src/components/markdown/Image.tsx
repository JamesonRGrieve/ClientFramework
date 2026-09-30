// SPDX-License-Identifier: AGPL-3.0-or-later
import Image from 'next/image.js';
import type { ReactNode } from 'react';

export interface ImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export default function MarkdownImage({ src, alt, className, ...props }: ImageProps): ReactNode {
  if (!src) {
    return null;
  }

  // Only this app's own files (the API is served on its origin) go through Next's optimiser;
  // anything remote is shown as-is rather than proxied.
  const sameOrigin = src.startsWith('/') && !src.startsWith('//');

  return (
    <div className={`relative w-full h-80 ${className || ''}`} {...props}>
      <Image src={src} alt={alt || ''} fill className='object-contain object-left-center' unoptimized={!sameOrigin} />
    </div>
  );
}
