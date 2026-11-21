// SPDX-License-Identifier: AGPL-3.0-or-later
// The Vitest entry: it registers the DOM matchers on Vitest's expect and types them on its Assertion.
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useParams: vi.fn(() => ({})),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
  // Like Next's, it never returns: it throws to hand the request to the not-found page.
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Mock next/image: a plain <img> with the string props (src, alt, className…); Next's loader and
// sizing props (`unoptimized`, `fill`, numeric width/height) are dropped. It must return a React
// element: a DOM node is not a valid React child.
vi.mock('next/image', async () => {
  const { createElement } = await import('react');
  return {
    default: vi.fn((props: Record<string, string | number | boolean | undefined>) =>
      createElement(
        'img',
        Object.fromEntries(Object.entries(props).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
      ),
    ),
  };
});

// Mock cookies-next
vi.mock('cookies-next', () => ({
  getCookie: vi.fn(() => undefined),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}));

// jsdom environment polyfills — these APIs don't exist in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  }),
});

// ResizeObserver: jsdom has no layout, so nothing ever resizes; React Flow observes its container.
class NoLayoutResizeObserver {
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
Object.defineProperty(globalThis, 'ResizeObserver', { writable: true, value: NoLayoutResizeObserver });

// scrollIntoView: jsdom has no layout, so there is nothing to scroll; cmdk scrolls the active item into view.
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {
    // Nothing to scroll without layout.
  };
}

// Global fetch stub
globalThis.fetch = vi.fn(async () =>
  Promise.resolve(
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ),
);
