'use client';

import { notFound } from 'next/navigation';
import { type ReactNode, use } from 'react';
// Import any other router components you want to use
// import AnotherRouter from '../another-router-path/AnotherRouter';

interface RouterParams {
  slug: string[];
}

type RouterSearchParams = Record<string, string | string[] | undefined>;

interface RouterComponentProps {
  params: RouterParams;
  searchParams: RouterSearchParams;
}

type RouterComponent = (props: RouterComponentProps) => ReactNode;

interface CatchAllPageProps {
  params: Promise<RouterParams>;
  searchParams: Promise<RouterSearchParams>;
}

export default function CatchAllPage({ params, searchParams }: CatchAllPageProps): ReactNode {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);

  const routers: RouterComponent[] = [
    // Add any other router components here.
  ];

  for (const Router of routers) {
    const result = Router({ params: resolvedParams, searchParams: resolvedSearchParams });
    if (result !== null) {
      return result;
    }
  }

  return notFound();
}
