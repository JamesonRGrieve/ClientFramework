// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * One choice in a set of chips where one at most is chosen: a button that reads as a radio, inside
 * an element with `role='radiogroup'` and the group's name. Unlike a native radio it can be chosen
 * again to clear it ("not recorded"), which is why it is a button. It comes styled as a pill that
 * fills with the primary tint when chosen; a `className` adds to that or overrides it. Give the group
 * `ref={chipGroup}` for the arrow keys.
 */
/** The chip's own look: a quiet pill, tinted with the primary colour when chosen. */
const CHIP =
  'rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring';

export function ChoiceChip({
  checked,
  className,
  ...button
}: Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'role' | 'aria-checked'> & {
  checked: boolean;
}): React.JSX.Element {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a native radio cannot be cleared by choosing it again; this is the WAI-ARIA radio pattern on a button.
    <button {...button} type='button' role='radio' aria-checked={checked} className={cn(CHIP, className)} />
  );
}
