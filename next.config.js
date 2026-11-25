// SPDX-License-Identifier: AGPL-3.0-or-later
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const ENV = (process.env.ENV || process.env.NODE_ENV || 'development').toLowerCase();
/**
 * The build's public origin, for what pages prerender for search and sharing (OG URLs). What the app
 * does with its origin at runtime (CSP, cookies, the API proxy) comes from runtime env through
 * zephyrex's middleware and publicEnv, so one build serves every instance: APP_URI, API_URI and
 * COOKIE_DOMAIN stay out of `env` below, which Next would inline at build.
 */
const APP_URI = process.env.APP_URI || 'http://localhost:1109';

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
  ...(ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.APP_NAME || 'Zephyrex',
    NEXT_PUBLIC_APP_DESCRIPTION: process.env.APP_DESCRIPTION || 'A Framework for Clients.',
    NEXT_PUBLIC_APP_URI: APP_URI,
    NEXT_PUBLIC_THEME_DEFAULT_MODE: process.env.DEFAULT_THEME_MODE || 'dark',
    NEXT_PUBLIC_TZ: process.env.TZ || 'America/New_York',
    NEXT_PUBLIC_ADSENSE_ACCOUNT: process.env.ADSENSE_ACCOUNT || '',
    NEXT_PUBLIC_ENV: ENV,
    NEXT_PUBLIC_LOG_VERBOSITY_CLIENT: process.env.NEXT_PUBLIC_LOG_VERBOSITY_CLIENT || '3',
    PRIVATE_ROUTES: process.env.PRIVATE_ROUTES || '/team,/provider',
  },
  devIndicators: {
    position: 'bottom-right',
  },
  // The API is served on this origin, so its HttpOnly session cookie is first-party: zephyrex's
  // middleware proxies /v1 and /graphql to the runtime API_URI (a rewrite here is fixed at build).
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
    ];
  },
};

module.exports = withSerwist(nextConfig);
