import '@testing-library/jest-dom';
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
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
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

// Global fetch stub
globalThis.fetch = vi.fn(() =>
  Promise.resolve(
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ),
);
