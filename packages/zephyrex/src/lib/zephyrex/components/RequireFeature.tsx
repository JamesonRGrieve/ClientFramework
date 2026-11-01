// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactNode } from 'react';
import { DEFAULT_AUTH_PATH } from '../authPath';
import { hasFeature, useEntitlement } from '../useEntitlement';
import { useZephyrexConfig } from '../ZephyrexProvider';
import { Button } from '@/components/ui/button';

/** Where a user goes to subscribe: the payment extension's page under the auth path. */
const SUBSCRIBE_PAGE = '/subscribe';

const humanize = (value: string): string => value.replaceAll('_', ' ');
/** "Kink matching" as it reads mid-sentence: "kink matching". */
const midSentence = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

/** What a user sees in place of a feature their plan lacks: what it is, and where to upgrade. */
export function UpgradePrompt({
  feature,
  title,
  compact = false,
}: {
  feature: string;
  title?: string | undefined;
  /** One line with a link, for a place that repeats it (each locked section of a form). */
  compact?: boolean;
}): ReactNode {
  const { config } = useZephyrexConfig();
  const subscribe = config.app.plans ?? `${config.auth?.authPath ?? DEFAULT_AUTH_PATH}${SUBSCRIBE_PAGE}`;
  if (compact) {
    return (
      <p role='note' aria-label='Upgrade' className='text-sm text-muted-foreground'>
        Part of a paid plan.{' '}
        <Link href={subscribe} className='font-medium text-primary hover:underline'>
          See plans
        </Link>
      </p>
    );
  }
  return (
    <div role='note' aria-label='Upgrade' className='grid gap-3 rounded-md border border-dashed p-4 text-sm'>
      <p>
        A paid plan unlocks <span className='font-medium'>{midSentence(title ?? humanize(feature))}</span>.
      </p>
      <div>
        <Button asChild size='sm'>
          <Link href={subscribe}>See plans</Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * `children` when the signed-in user's plan unlocks `feature`; otherwise `fallback`, an upgrade
 * prompt by default. Nothing shows while the plan loads. The server enforces the same rule; this
 * only decides what to show.
 */
export function RequireFeature({
  feature,
  title,
  children,
  fallback,
}: {
  feature: string;
  /** How the prompt names the feature; its id, humanised, when omitted. */
  title?: string | undefined;
  children: ReactNode;
  fallback?: ReactNode;
}): ReactNode {
  const { data } = useEntitlement();
  if (data === undefined) {
    return null;
  }
  if (hasFeature(data, feature)) {
    return children;
  }
  return fallback ?? <UpgradePrompt feature={feature} title={title} />;
}
