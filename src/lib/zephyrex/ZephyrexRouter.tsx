// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { notFound } from 'next/navigation';
import { useZephyrexConfig } from './ZephyrexProvider';

function matchRoute(pattern: string, slug: string[]): boolean {
  const patternParts = pattern.split('/').filter(Boolean);
  if (patternParts.length !== slug.length) return false;
  return patternParts.every((part, i) => part.startsWith(':') || part.startsWith('[') || part === slug[i]);
}

export function ZephyrexRouter({
  params,
  searchParams,
}: {
  params: { slug: string[] };
  searchParams: Record<string, string>;
}) {
  const { routes } = useZephyrexConfig();

  for (const route of routes) {
    if (matchRoute(route.path, params.slug)) {
      const Component = route.component;
      return <Component params={params} searchParams={searchParams} />;
    }
  }

  return notFound();
}
