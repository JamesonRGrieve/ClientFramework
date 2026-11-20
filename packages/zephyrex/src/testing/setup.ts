// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The Vitest setup every Zephyrex app's jsdom tests need, in one place: list it in `setupFiles`
 * (`setupFiles: ['zephyrex/testing/setup', …]`) instead of copying the stubs. jsdom has no layout
 * and no pointer capture, so the framework's Radix primitives need a few stand-ins; and the toast
 * store is module-level, so it is cleared after every test. Each stub is defined only where jsdom
 * lacks the API, so an app's own stand-in (or a newer jsdom) wins.
 */
import { afterEach } from 'vitest';
import { clearToasts } from '../hooks/useToast';

/** A media query that never matches: jsdom has no screen, so no preference holds. */
function unmatched(query: string): MediaQueryList {
  const list: MediaQueryList = {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  };
  return list;
}

/** jsdom has no layout, so nothing ever resizes: Radix's slider and React Flow observe anyway. */
class NoLayoutResizeObserver implements ResizeObserver {
  observe(): void {
    // Nothing to watch without layout.
  }
  unobserve(): void {
    // Nothing was watched.
  }
  disconnect(): void {
    // Nothing was watched.
  }
}

/** Installs the stand-ins jsdom lacks. Exported for a setup file that needs them before its own code. */
export function installJsdomStandIns(): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (!('matchMedia' in window)) {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: unmatched });
  }
  if (!('ResizeObserver' in window)) {
    Object.defineProperty(window, 'ResizeObserver', { writable: true, value: NoLayoutResizeObserver });
  }
  // Radix's toast and slider capture the pointer; jsdom has no pointer capture.
  const element: Partial<Element> = Element.prototype;
  element.hasPointerCapture ??= (): boolean => false;
  element.setPointerCapture ??= (): void => undefined;
  element.releasePointerCapture ??= (): void => undefined;
  // cmdk scrolls its active item into view; jsdom has nothing to scroll.
  element.scrollIntoView ??= (): void => undefined;
}

installJsdomStandIns();

afterEach(() => {
  clearToasts();
});
