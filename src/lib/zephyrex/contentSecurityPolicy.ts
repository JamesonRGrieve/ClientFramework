// SPDX-License-Identifier: AGPL-3.0-or-later

/** The directives an app may add sources to, in the order the policy lists them. */
const SOURCE_DIRECTIVES = [
  'script-src',
  'style-src',
  'img-src',
  'font-src',
  'connect-src',
  'media-src',
  'frame-src',
  'worker-src',
] as const;

export type CspDirective = (typeof SOURCE_DIRECTIVES)[number];

/** Sources an app adds to the framework's policy, by directive (e.g. an analytics host in connect-src). */
export type CspAdditions = Partial<Record<CspDirective, readonly string[]>>;

/** The random bytes behind each request's nonce. */
const NONCE_BYTES = 16;

/**
 * The framework's own needs. Scripts run only with the request's nonce, or when a trusted script
 * loaded them ('strict-dynamic': how Stripe's pricing table and reCAPTCHA arrive); styles stay inline
 * because components set style attributes. The API is same-origin, so 'self' covers it and its
 * WebSocket.
 */
const BASE_SOURCES: Record<CspDirective, readonly string[]> = {
  // Browsers without 'strict-dynamic' fall back to the provider hosts; those with it ignore them.
  'script-src': ["'self'", "'strict-dynamic'", 'https://js.stripe.com', 'https://www.google.com', 'https://www.gstatic.com'],
  'style-src': ["'self'", "'unsafe-inline'"],
  // Markdown and avatars show images from anywhere on https.
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'media-src': ["'self'", 'blob:'],
  // Stripe's pricing table, reCAPTCHA's challenge, and YouTube links embedded by markdown.
  'frame-src': ['https://js.stripe.com', 'https://www.google.com', 'https://www.youtube.com'],
  'worker-src': ["'self'", 'blob:'],
};

/** A fresh base64 nonce for one response. */
export function mintNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * The Content-Security-Policy for one response. Development adds what Next's dev server needs:
 * eval for fast refresh, and its WebSocket.
 */
export function contentSecurityPolicy({
  nonce,
  development,
  additions = {},
}: {
  nonce: string;
  development: boolean;
  additions?: CspAdditions;
}): string {
  const extra: CspAdditions = {
    'script-src': [`'nonce-${nonce}'`, ...(development ? ["'unsafe-eval'"] : [])],
    'connect-src': development ? ['ws:'] : [],
  };
  const directives = SOURCE_DIRECTIVES.map((directive) => {
    const sources = new Set([...BASE_SOURCES[directive], ...(extra[directive] ?? []), ...(additions[directive] ?? [])]);
    return `${directive} ${[...sources].join(' ')}`;
  });
  return [
    "default-src 'self'",
    ...directives,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}
