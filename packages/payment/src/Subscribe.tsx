'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getCookie } from 'cookies-next/client';
import { useSearchParams } from 'next/navigation.js';
import { createElement, type ReactElement, useEffect } from 'react';

/** The app's Stripe pricing table; nothing here reads the environment. */
export interface StripePricingTable {
  /** The table's id (`prctbl_…`); none configured means subscribing is not offered here. */
  pricingTableId?: string | undefined;
  /** The account's publishable key (`pk_…`). */
  publishableKey?: string | undefined;
}

/** Stripe's pricing-table element. Stripe updates it in place, so it cannot carry an integrity hash. */
export const STRIPE_PRICING_TABLE_SCRIPT = 'https://js.stripe.com/v3/pricing-table.js';

/**
 * Loads Stripe's pricing-table script once. It is added from script rather than rendered as a tag:
 * a server-rendered tag has no CSP nonce and 'strict-dynamic' would block it, whereas a script
 * added by the app's own (trusted) code is allowed.
 */
function useStripePricingTableScript(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || document.querySelector(`script[src="${STRIPE_PRICING_TABLE_SCRIPT}"]`) !== null) {
      return;
    }
    const script = document.createElement('script');
    script.src = STRIPE_PRICING_TABLE_SCRIPT;
    script.async = true;
    document.head.append(script);
  }, [enabled]);
}

/**
 * The attributes Stripe's table reads: a customer session when the query carries one, else the
 * email to prefill (from the query, or the one remembered at sign-in).
 */
function customerAttributes(query: Pick<URLSearchParams, 'get'>): Record<string, string> {
  const session = query.get('customer_session');
  if (session !== null) {
    return { 'customer-session-client-secret': session };
  }
  const email = query.get('email') ?? getCookie('email');
  return typeof email === 'string' && email !== '' ? { 'customer-email': email } : {};
}

/**
 * Where a user without a subscription lands (`<authPath>/subscribe`, where the auth middleware
 * sends a 402). Plans live in the payment provider: this shows the provider's hosted pricing table
 * when the app configures one, and otherwise says subscribing is not available here.
 */
export function Subscribe({ pricingTableId = '', publishableKey = '' }: StripePricingTable): ReactElement {
  const query = useSearchParams();
  useStripePricingTableScript(pricingTableId !== '');

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-4 p-4'>
      <h1 className='text-3xl'>Subscribe</h1>
      {pricingTableId === '' ? (
        <p role='status' className='text-sm text-muted-foreground'>
          Subscriptions are not available here yet. Contact the administrator for access.
        </p>
      ) : (
        // A custom element: React 19 passes its attributes through as given.
        createElement('stripe-pricing-table', {
          'pricing-table-id': pricingTableId,
          'publishable-key': publishableKey,
          ...customerAttributes(query),
        })
      )}
    </main>
  );
}
