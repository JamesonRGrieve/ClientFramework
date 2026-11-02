// SPDX-License-Identifier: AGPL-3.0-or-later
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import {
  formatPrice,
  type Product,
  type SquareCard,
  SquareCheckout,
  type SquareCheckoutProps,
  squareCspAdditions,
  squareScript,
  type SquareSdk,
} from './SquareCheckout';

const REPORT: Product = {
  id: 'full_report',
  plan: 'report',
  amount: '19.00',
  currency: 'USD',
  description: 'The full report',
  features: ['full_report'],
};
const PAY = 'Pay $19.00';
const ACCOUNT = { applicationId: 'sandbox-sq0idb-test', locationId: 'L1', environment: 'sandbox' } as const;

/** Square's SDK, answering `tokenize` with `token` (or failing with `errors`). */
function fakeSquare(token: Awaited<ReturnType<SquareCard['tokenize']>>): { sdk: SquareSdk; card: SquareCard } {
  const card: SquareCard = {
    attach: vi.fn(async () => Promise.resolve()),
    tokenize: vi.fn(async () => Promise.resolve(token)),
    destroy: vi.fn(async () => Promise.resolve(true)),
  };
  return { sdk: { payments: () => ({ card: async () => Promise.resolve(card) }) }, card };
}

/** Serves the product list and `purchase`; records each purchase body as sent. */
function serve(purchase: () => Response): { bodies: string[] } {
  const bodies: string[] = [];
  vi.stubGlobal(
    'fetch',
    fetchFrom([
      http.get('*/v1/entitlement/products', () => HttpResponse.json({ products: [REPORT] })),
      http.post('*/v1/entitlement/purchase', async ({ request }) => {
        bodies.push(await request.text());
        return purchase();
      }),
    ]),
  );
  return { bodies };
}

function renderCheckout(props: Partial<SquareCheckoutProps> & { sdk: SquareSdk }): void {
  const { sdk, ...rest } = props;
  render(
    <TestWrapper>
      <SquareCheckout {...ACCOUNT} productId='full_report' loadSdk={async () => Promise.resolve(sdk)} {...rest} />
    </TestWrapper>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SquareCheckout', () => {
  it('says card payments are off when no Square account is configured', () => {
    render(
      <TestWrapper>
        <SquareCheckout productId='full_report' />
      </TestWrapper>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('not available');
  });

  it('shows the server’s price and buys with Square’s token, never a price of its own', async () => {
    const { sdk, card } = fakeSquare({ status: 'OK', token: 'cnon:card-nonce-ok' });
    const { bodies } = serve(() =>
      HttpResponse.json({ payment_id: 'p1', status: 'succeeded', entitlement: { plan: 'report', features: [] } }),
    );
    const onPurchased = vi.fn();
    renderCheckout({ sdk, onPurchased });

    const pay = await screen.findByRole('button', { name: PAY });
    expect(card.attach).toHaveBeenCalled();
    fireEvent.click(pay);

    await waitFor(() => expect(onPurchased).toHaveBeenCalledOnce());
    expect(bodies).toEqual([JSON.stringify({ product_id: 'full_report', payment_method_id: 'cnon:card-nonce-ok' })]);
    expect(screen.getByRole('status')).toHaveTextContent('Payment received');
  });

  it('shows Square’s card errors and sends nothing', async () => {
    const { sdk } = fakeSquare({ status: 'Invalid', errors: [{ message: 'Card number is not valid.' }] });
    const { bodies } = serve(() => HttpResponse.json({}));
    renderCheckout({ sdk });
    fireEvent.click(await screen.findByRole('button', { name: PAY }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Card number is not valid.');
    expect(bodies).toEqual([]);
  });

  it('shows the server’s refusal, such as a plan already held', async () => {
    const { sdk } = fakeSquare({ status: 'OK', token: 'cnon:ok' });
    serve(() => HttpResponse.json({ detail: 'Your plan already includes this' }, { status: 409 }));
    renderCheckout({ sdk });
    fireEvent.click(await screen.findByRole('button', { name: PAY }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your plan already includes this');
  });

  it('reports a payment that did not complete', async () => {
    const { sdk } = fakeSquare({ status: 'OK', token: 'cnon:ok' });
    serve(() => HttpResponse.json({ payment_id: 'p1', status: 'failed', entitlement: { plan: 'free', features: [] } }));
    renderCheckout({ sdk });
    fireEvent.click(await screen.findByRole('button', { name: PAY }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not completed (failed)');
  });

  it('refuses a product the server does not sell', async () => {
    const { sdk } = fakeSquare({ status: 'OK', token: 'cnon:ok' });
    serve(() => HttpResponse.json({}));
    renderCheckout({ sdk, productId: 'nothing' });
    expect(await screen.findByRole('alert')).toHaveTextContent('not for sale');
  });
});

describe('Square helpers', () => {
  it('formats prices in the product’s currency', () => {
    expect(formatPrice(REPORT)).toBe('$19.00');
    expect(formatPrice({ amount: '5', currency: 'CAD' })).toBe('CA$5.00');
  });

  it('points sandbox and production at Square’s own hosts, from its published CSP', () => {
    expect(squareScript('sandbox')).toBe('https://sandbox.web.squarecdn.com/v1/square.js');
    expect(squareScript('production')).toBe('https://web.squarecdn.com/v1/square.js');
    expect(squareCspAdditions('production')['connect-src']).toContain('https://pci-connect.squareup.com');
    expect(squareCspAdditions('sandbox')['frame-src']).toEqual(['https://sandbox.web.squarecdn.com']);
  });
});
