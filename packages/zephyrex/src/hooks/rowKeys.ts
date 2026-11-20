// SPDX-License-Identifier: AGPL-3.0-or-later

/** The keys that move between rows: J and K as in mail and feed readers, and the arrows. */
const NEXT = new Set(['j', 'ArrowDown']);
const PREVIOUS = new Set(['k', 'ArrowUp']);

/** A row in a list that takes row keys. */
const ROW = '[data-row]';
/** Inside a row: the control the row keys land on (its main link or button), and the one Delete presses. */
const OPEN = '[data-row-open]';
const REMOVE = '[data-row-remove]';

/** Typing in a field inside a row keeps its letters: the row keys only act on the row's controls. */
const typingIn = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Keys for a list of rows, each marked `data-row` with its main control marked `data-row-open`:
 * J or ↓ moves to the next row's main control and K or ↑ to the previous one, where Enter does what
 * that control does; Delete (or Backspace) presses the row's `data-row-remove` control. Tab still
 * reaches everything, so this only adds the keys people who work through long lists expect.
 */
export function rowKeys(event: KeyboardEvent): void {
  if (!(event.currentTarget instanceof HTMLElement) || typingIn(event.target) || event.metaKey || event.ctrlKey) {
    return;
  }
  const row = document.activeElement instanceof HTMLElement ? document.activeElement.closest<HTMLElement>(ROW) : null;
  if (NEXT.has(event.key) || PREVIOUS.has(event.key)) {
    moveFrom(event, event.currentTarget, row);
  } else if (row !== null && (event.key === 'Delete' || event.key === 'Backspace')) {
    press(event, row.querySelector<HTMLElement>(REMOVE));
  }
}

/** Focuses the next or previous row's main control (the first row's, from outside every row). */
function moveFrom(event: KeyboardEvent, list: HTMLElement, row: HTMLElement | null): void {
  const rows = [...list.querySelectorAll<HTMLElement>(ROW)];
  const at = row === null ? -1 : rows.indexOf(row);
  const step = NEXT.has(event.key) ? 1 : -1;
  const to = at === -1 ? 0 : Math.min(Math.max(at + step, 0), rows.length - 1);
  const control = rows.at(to)?.querySelector<HTMLElement>(OPEN) ?? null;
  if (control !== null) {
    event.preventDefault();
    control.focus();
  }
}

/** Presses a row's control for this key, when the row has one. */
function press(event: KeyboardEvent, control: HTMLElement | null): void {
  if (control !== null) {
    event.preventDefault();
    control.click();
  }
}

/**
 * The row keys as a callback ref: `<ul ref={rowList}>` listens on the list itself, and React removes
 * the listener when the list unmounts.
 */
export function rowList(list: HTMLElement | null): (() => void) | undefined {
  if (list === null) {
    return undefined;
  }
  list.addEventListener('keydown', rowKeys);
  return () => list.removeEventListener('keydown', rowKeys);
}
