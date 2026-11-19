// SPDX-License-Identifier: AGPL-3.0-or-later
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const NEXT = new Set(['ArrowRight', 'ArrowDown']);
const PREVIOUS = new Set(['ArrowLeft', 'ArrowUp']);

/** What chipKeys reads from a key press: React's synthetic event and the DOM's own both carry it. */
interface ChipKeyPress {
  key: string;
  currentTarget: EventTarget | null;
  preventDefault: () => void;
}

/**
 * Arrow keys move between the buttons of a chip group; Home and End jump to the ends. Tab still
 * reaches every chip, so this only adds the keys people expect from a set of choices. Give the group
 * `ref={chipGroup}` (below); `onKeyDown={chipKeys}` also works where a handler is welcome.
 */
export function chipKeys(event: ChipKeyPress | ReactKeyboardEvent<HTMLElement>): void {
  if (!(event.currentTarget instanceof HTMLElement)) {
    return;
  }
  const chips = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
  const at = chips.indexOf(document.activeElement as HTMLButtonElement);
  if (at === -1) {
    return;
  }
  let to: number | null = null;
  if (NEXT.has(event.key)) {
    to = (at + 1) % chips.length;
  } else if (PREVIOUS.has(event.key)) {
    to = (at - 1 + chips.length) % chips.length;
  } else if (event.key === 'Home') {
    to = 0;
  } else if (event.key === 'End') {
    to = chips.length - 1;
  }
  if (to !== null) {
    event.preventDefault();
    chips[to]?.focus();
  }
}

/**
 * The chip keys as a callback ref: `<div ref={chipGroup}>` listens for them on the group itself, so
 * a plain box holding the chips needs no key handler of its own (which linters rightly question on
 * an element with no role). React removes the listener when the group unmounts.
 */
export function chipGroup(group: HTMLElement | null): (() => void) | undefined {
  if (group === null) {
    return undefined;
  }
  group.addEventListener('keydown', chipKeys);
  return () => group.removeEventListener('keydown', chipKeys);
}
