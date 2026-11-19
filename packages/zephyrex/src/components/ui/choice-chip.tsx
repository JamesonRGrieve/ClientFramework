// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * One choice in a set of chips where one at most is chosen: a button that reads as a radio, inside
 * an element with `role='radiogroup'` and the group's name. Unlike a native radio it can be chosen
 * again to clear it ("not recorded"), which is why it is a button. Style the chosen state with
 * `aria-checked:`; give the group `ref={chipGroup}` for the arrow keys.
 */
export function ChoiceChip({
  checked,
  className,
  ...button
}: Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'role' | 'aria-checked'> & {
  checked: boolean;
}): React.JSX.Element {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a native radio cannot be cleared by choosing it again; this is the WAI-ARIA radio pattern on a button.
    <button {...button} type='button' role='radio' aria-checked={checked} className={cn(className)} />
  );
}
