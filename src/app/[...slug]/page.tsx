'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ZephyrexRouter } from '@/lib/zephyrex';
import { type ReactNode, use } from 'react';

interface CatchAllPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string>>;
}

export default function CatchAllPage({ params, searchParams }: CatchAllPageProps): ReactNode {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  return <ZephyrexRouter params={resolvedParams} searchParams={resolvedSearchParams} />;
}
