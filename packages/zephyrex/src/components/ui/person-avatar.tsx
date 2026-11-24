// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactElement } from 'react';
import { personTone, personToneClass } from './person-tone';
import { cn } from '@/lib/utils';

const SIZES = {
  xs: 'size-5 text-[0.6rem]',
  sm: 'size-6 text-[0.65rem]',
  md: 'size-8 text-xs',
  lg: 'size-12 text-base',
} as const;

/** Up to two initials from a name: "Ada King Lovelace" → "AL", "You" → "Y". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words.at(0)?.charAt(0) ?? '';
  const last = words.length > 1 ? (words.at(-1)?.charAt(0) ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * A person as a round badge of their initials in their colour (a theme token, see person-tone), the
 * same on every page. Decorative: the name it stands for is shown, or read, beside it. Pass `tone`
 * from personTones for a view of a few people, so no two side by side share a colour.
 */
export function PersonAvatar({
  id,
  name,
  tone,
  initials,
  size = 'sm',
  className,
}: {
  /** The person's account or record id, which picks their colour. */
  id: string;
  name: string;
  /** Their colour in this view (personTones); their own colour otherwise. */
  tone?: number | undefined;
  /** Instead of the name's initials. */
  initials?: string | undefined;
  size?: keyof typeof SIZES;
  className?: string | undefined;
}): ReactElement {
  return (
    <span
      aria-hidden='true'
      data-tone={tone ?? personTone(id)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-background',
        SIZES[size],
        personToneClass(tone ?? personTone(id)),
        className,
      )}
    >
      {initials ?? initialsOf(name)}
    </span>
  );
}
