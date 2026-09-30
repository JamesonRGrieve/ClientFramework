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

// Mock next/image
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }: Record<string, unknown>) => {
    // Return a plain img element for testing
    const img = document.createElement('img');
    img.setAttribute('src', typeof src === 'string' ? src : '');
    img.setAttribute('alt', typeof alt === 'string' ? alt : '');
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string') {
        img.setAttribute(key, value);
      }
    }
    return img;
  }),
}));

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

// Global fetch stub
globalThis.fetch = vi.fn(async () =>
  Promise.resolve(
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ),
);
