// SPDX-License-Identifier: AGPL-3.0-or-later
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const ENV = (process.env.ENV || process.env.NODE_ENV || 'development').toLowerCase();
const APP_URI = process.env.APP_URI || 'http://localhost:1109';
/** Where the Next server reaches the API; the browser only ever talks to this app's origin. */
const API_URI = (process.env.API_URI || 'http://localhost:1996').replace(/\/$/, '');

/** The registrable domain of APP_URI, so cookies the app sets are shared with its subdomains. */
const cookieDomain = () => {
  const host = ((APP_URI.split('://')[1] ?? '').split('/')[0] ?? '').split(':')[0] ?? '';
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) ? host : host.split('.').slice(-2).join('.');
};

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
    NEXT_PUBLIC_COOKIE_DOMAIN: cookieDomain(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID: process.env.STRIPE_PRICING_TABLE_ID || '',
    API_URI,
    PRIVATE_ROUTES: process.env.PRIVATE_ROUTES || '/team,/provider',
  },
  devIndicators: {
    position: 'bottom-right',
  },
  // The API is served on this origin, so its HttpOnly session cookie is first-party.
  async rewrites() {
    return [
      { source: '/v1/:path*', destination: `${API_URI}/v1/:path*` },
      { source: '/graphql', destination: `${API_URI}/graphql` },
    ];
  },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
    ];
  },
};

module.exports = withSerwist(nextConfig);
