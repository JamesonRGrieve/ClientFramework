// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Square's hosts for the card form, from its published Web Payments policy. A plain module (no
 * 'use client'), so an app's server-side config can build its Content-Security-Policy from it.
 */

export type SquareEnvironment = 'sandbox' | 'production';

/** The app's Square account for card payments; nothing here reads the environment. */
export interface SquareAccount {
  /** The application id (`sq0idp-…`, or `sandbox-sq0idb-…`); none means card payments are off here. */
  applicationId?: string | undefined;
  /** The location the payment is taken at. */
  locationId?: string | undefined;
  environment?: SquareEnvironment;
}

const HOSTS: Record<SquareEnvironment, { cdn: string; pci: string }> = {
  sandbox: { cdn: 'https://sandbox.web.squarecdn.com', pci: 'https://pci-connect.squareupsandbox.com' },
  production: { cdn: 'https://web.squarecdn.com', pci: 'https://pci-connect.squareup.com' },
};

/** Square's diagnostics endpoint and font hosts, from its published Web Payments CSP. */
const SQUARE_TELEMETRY = 'https://o160250.ingest.sentry.io';
const SQUARE_FONTS = ['https://square-fonts-production-f.squarecdn.com', 'https://d1g145x70srn7h.cloudfront.net'];

/** Square's Web Payments SDK. Square serves it unversioned, so it cannot carry an integrity hash. */
export function squareScript(environment: SquareEnvironment): string {
  return `${HOSTS[environment].cdn}/v1/square.js`;
}

/**
 * What the app adds to the framework's Content-Security-Policy (`contentSecurityPolicy` in its config) for the card
 * form, from Square's published policy. The script itself arrives under 'strict-dynamic'.
 */
export function squareCspAdditions(environment: SquareEnvironment): Record<string, readonly string[]> {
  const { cdn, pci } = HOSTS[environment];
  return {
    'script-src': [cdn],
    'style-src': [cdn],
    'frame-src': [cdn],
    'connect-src': [cdn, pci, SQUARE_TELEMETRY],
    'font-src': SQUARE_FONTS,
  };
}
