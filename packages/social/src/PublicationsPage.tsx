// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { type ReactElement, useId, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { publicationPath } from './routes';
import { platformName, type SocialPublication, useSocialPublications } from './socialApi';

const ALL_PLATFORMS = '';
const EXCERPT_LENGTH = 140;

const excerpt = (content: string): string =>
  content.length > EXCERPT_LENGTH ? `${content.slice(0, EXCERPT_LENGTH).trimEnd()}…` : content;

const publishedOn = (publication: SocialPublication): string => new Date(publication.published_at).toLocaleString();

/**
 * Every post the server published to a social platform on the user's accounts, newest first,
 * filterable by platform. Posting happens server side; this is the record of what went out.
 */
export function PublicationsPage(): ReactElement {
  const filterId = useId();
  const publications = useSocialPublications();
  const [platform, setPlatform] = useState(ALL_PLATFORMS);
  const all = publications.data ?? [];
  const platforms = [...new Set(all.map(({ provider }) => provider))].sort();
  const shown = platform === ALL_PLATFORMS ? all : all.filter(({ provider }) => provider === platform);

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>Social posts</CardTitle>
          <CardDescription>What was published to your social accounts, newest first.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {platforms.length > 1 && (
            <div className='flex items-center gap-2'>
              <Label htmlFor={filterId}>Platform</Label>
              <select
                id={filterId}
                className='rounded-md border bg-background px-2 py-1 text-sm'
                value={platform}
                onChange={(event) => {
                  setPlatform(event.target.value);
                }}
              >
                <option value={ALL_PLATFORMS}>All platforms</option>
                {platforms.map((provider) => (
                  <option key={provider} value={provider}>
                    {platformName(provider)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {publications.error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The posts could not be loaded: {publications.error.message}
            </p>
          )}
          {publications.error === undefined && shown.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              {publications.isLoading ? 'Loading…' : 'Nothing has been posted yet.'}
            </p>
          )}
          {shown.length > 0 && (
            <ul aria-label='Social posts' className='divide-y rounded-md border'>
              {shown.map((publication) => (
                <li key={publication.id} className='grid gap-1 px-4 py-3 text-sm'>
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    <Link href={publicationPath(publication.id)} className='font-medium hover:underline'>
                      {platformName(publication.provider)}
                    </Link>
                    <span className='text-muted-foreground'>{publishedOn(publication)}</span>
                  </div>
                  <p className='whitespace-pre-line'>{excerpt(publication.content)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
