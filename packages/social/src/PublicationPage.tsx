// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { SOCIAL_PATH } from './routes';
import { linkTarget, platformName, useSocialPublication } from './socialApi';

/** An outside address: a link that opens apart from the app when it is http(s), else plain text. */
function OutsideLink({ href, children }: { href: string; children: string }): ReactElement {
  const target = linkTarget(href);
  return target === null ? (
    <span className='break-all'>{children}</span>
  ) : (
    <a href={target} target='_blank' rel='noopener noreferrer' className='break-all underline'>
      {children}
    </a>
  );
}

function BackLink(): ReactElement {
  return (
    <Link href={SOCIAL_PATH} className='text-sm underline'>
      Back to the social posts
    </Link>
  );
}

/** One published post: its full text, its media, and a link to it on the platform. */
export function PublicationPage({ params }: { params: Record<string, string> }): ReactElement {
  const { publicationId = '' } = params;
  const publication = useSocialPublication(publicationId);

  if (publication.error !== undefined) {
    return (
      <main className='mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-10'>
        <p role='alert' className='text-sm text-destructive'>
          The post could not be loaded: {publication.error.message}
        </p>
        <BackLink />
      </main>
    );
  }
  if (publication.data === undefined || publication.data === null) {
    return (
      <main className='mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-10'>
        <p className='text-sm text-muted-foreground'>
          {publication.isLoading ? 'Loading…' : 'This post does not exist, or is not yours to see.'}
        </p>
        <BackLink />
      </main>
    );
  }

  const { provider, content, media_urls: mediaUrls, url, published_at: publishedAt } = publication.data;
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-10'>
      <BackLink />
      <Card>
        <CardHeader>
          <CardTitle>{platformName(provider)} post</CardTitle>
          <CardDescription>Published {new Date(publishedAt).toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 text-sm'>
          <p className='whitespace-pre-line'>{content}</p>
          {mediaUrls !== null && (
            <section aria-label='Media' className='grid gap-1'>
              <h3 className='font-medium'>Media</h3>
              <ul className='grid gap-1'>
                {mediaUrls.map((mediaUrl) => (
                  <li key={mediaUrl}>
                    <OutsideLink href={mediaUrl}>{mediaUrl}</OutsideLink>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {url !== null && <OutsideLink href={url}>{`View on ${platformName(provider)}`}</OutsideLink>}
        </CardContent>
      </Card>
    </main>
  );
}
