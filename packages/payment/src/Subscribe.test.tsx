// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, type RenderResult } from '@testing-library/react';
import { deleteCookie, setCookie } from 'cookies-next/client';
import type * as NextNavigation from 'next/navigation.js';
import { useSearchParams } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STRIPE_PRICING_TABLE_SCRIPT, type StripePricingTable, Subscribe } from './Subscribe';

// The root test setup mocks next/navigation; the real read-only params class is what the page gets.
const { ReadonlyURLSearchParams } = await vi.importActual<typeof NextNavigation>('next/navigation.js');

const CONFIGURED: StripePricingTable = { pricingTableId: 'prctbl_1', publishableKey: 'pk_test_1' };
const EMAIL = 'ada@example.com';
/** The table attribute that prefills the customer's email. */
const CUSTOMER_EMAIL = 'customer-email';

/** Renders the page, for `pricingTable`, as if opened with `query`. */
const renderAt = (pricingTable: StripePricingTable, query: Record<string, string> = {}): RenderResult => {
  vi.mocked(useSearchParams).mockReturnValue(new ReadonlyURLSearchParams(new URLSearchParams(query)));
  return render(<Subscribe {...pricingTable} />);
};

const table = (view: RenderResult): Element | null => view.container.querySelector('stripe-pricing-table');
const stripeScripts = (): number => document.head.querySelectorAll(`script[src="${STRIPE_PRICING_TABLE_SCRIPT}"]`).length;

describe('Subscribe', () => {
  afterEach(() => {
    deleteCookie('email');
    document.head.querySelectorAll(`script[src="${STRIPE_PRICING_TABLE_SCRIPT}"]`).forEach((script) => {
      script.remove();
    });
  });

  it('loads Stripe’s script from the app’s code, once, and only when a table is configured', () => {
    renderAt({}).unmount();
    expect(stripeScripts()).toBe(0);
    const view = renderAt(CONFIGURED);
    // Not a server-rendered tag, which would carry no CSP nonce.
    expect(view.container.querySelector('script')).toBeNull();
    renderAt(CONFIGURED);
    expect(stripeScripts()).toBe(1);
  });

  it('says subscribing is not available when the app configures no pricing table', () => {
    const view = renderAt({});
    expect(view.getByRole('heading', { name: 'Subscribe' })).toBeInTheDocument();
    expect(view.getByRole('status')).toHaveTextContent('Subscriptions are not available here yet');
    expect(table(view)).toBeNull();
  });

  it('shows the provider’s hosted pricing table for the email in the query', () => {
    const view = renderAt(CONFIGURED, { email: EMAIL });
    expect(table(view)).toHaveAttribute('pricing-table-id', 'prctbl_1');
    expect(table(view)).toHaveAttribute('publishable-key', 'pk_test_1');
    expect(table(view)).toHaveAttribute(CUSTOMER_EMAIL, EMAIL);
  });

  it('falls back to the email remembered at sign-in', () => {
    setCookie('email', EMAIL);
    expect(table(renderAt(CONFIGURED))).toHaveAttribute(CUSTOMER_EMAIL, EMAIL);
  });

  it('hands a customer session to the table instead of an email', () => {
    const view = renderAt(CONFIGURED, { customer_session: 'cs_1', email: EMAIL });
    expect(table(view)).toHaveAttribute('customer-session-client-secret', 'cs_1');
    expect(table(view)).not.toHaveAttribute(CUSTOMER_EMAIL);
  });
});
