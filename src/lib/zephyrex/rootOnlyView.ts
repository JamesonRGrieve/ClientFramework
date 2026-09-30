// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createElement, type JSX } from 'react';
import { ApiError } from './client';

const FORBIDDEN = 403;

/** A root-only view's data once it has loaded, or what to show in its place until then. */
export type RootOnlyView<T> = { data: T; fallback: null } | { data: undefined; fallback: JSX.Element };

const note = (text: string, tone: 'muted' | 'error'): JSX.Element =>
  createElement('p', { className: `p-4 text-sm ${tone === 'error' ? 'text-destructive' : 'text-muted-foreground'}` }, text);

/**
 * Why the server refused (it's root only), that loading failed, or that it is still loading; or the
 * data, once there is some. `subject` completes "view …" and "load …", e.g. "provider status".
 */
export function rootOnlyView<T>(
  { data, error }: { data: T | undefined; error: Error | undefined },
  subject: string,
): RootOnlyView<T> {
  if (error instanceof ApiError && error.status === FORBIDDEN) {
    return { data: undefined, fallback: note(`Only the root user can view ${subject}.`, 'muted') };
  }
  if (error !== undefined) {
    return { data: undefined, fallback: note(`Failed to load ${subject}.`, 'error') };
  }
  if (data === undefined) {
    return { data: undefined, fallback: note('Loading…', 'muted') };
  }
  return { data, fallback: null };
}
