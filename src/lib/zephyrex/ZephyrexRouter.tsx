// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { notFound } from 'next/navigation';
import { useZephyrexConfig } from './ZephyrexProvider';

const isParamSegment = (segment: string): boolean => segment.startsWith(':') || segment.startsWith('[');
const paramName = (segment: string): string => segment.replace(/^:|^\[|]$/g, '');

/**
 * Match `slug` against a route pattern such as `analytics/:report` (or `analytics/[report]`).
 * Returns the named parameters on a match, `null` otherwise.
 */
export function matchRoute(pattern: string, slug: readonly string[]): Record<string, string> | null {
  const segments = pattern.split('/').filter(Boolean);
  if (segments.length !== slug.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (const [index, segment] of segments.entries()) {
    const value = slug.at(index) ?? '';
    if (isParamSegment(segment)) {
      params[paramName(segment)] = value;
    } else if (segment !== value) {
      return null;
    }
  }
  return params;
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
    const matched = matchRoute(route.path, params.slug);
    if (matched !== null) {
      const Component = route.component;
      return <Component params={{ ...matched, slug: params.slug.join('/') }} searchParams={searchParams} />;
    }
  }

  return notFound();
}
