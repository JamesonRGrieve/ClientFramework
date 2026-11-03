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
const SEAT: Product = {
  id: 'group_seat',
  plan: null,
  amount: '2.00',
  currency: 'USD',
  description: 'A group seat',
  features: [],
  max_quantity: 1000,
  needs_subject: true,
};
const PAY = 'Pay $19.00';
/** Square's sandbox token for a card that is charged. */
const CARD_TOKEN = 'cnon:card-nonce-ok';
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
      http.get('*/v1/entitlement/products', () => HttpResponse.json({ products: [REPORT, SEAT] })),
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
    const { sdk, card } = fakeSquare({ status: 'OK', token: CARD_TOKEN });
    const { bodies } = serve(() =>
      HttpResponse.json({ payment_id: 'p1', status: 'succeeded', entitlement: { plan: 'report', features: [] } }),
    );
    const onPurchased = vi.fn();
    renderCheckout({ sdk, onPurchased });

    const pay = await screen.findByRole('button', { name: PAY });
    expect(card.attach).toHaveBeenCalled();
    fireEvent.click(pay);

    await waitFor(() => expect(onPurchased).toHaveBeenCalledOnce());
    expect(bodies).toEqual([JSON.stringify({ product_id: 'full_report', payment_method_id: CARD_TOKEN, quantity: 1 })]);
    expect(screen.getByRole('status')).toHaveTextContent('Payment received');
  });

  it('buys units for a subject at the unit price times the quantity', async () => {
    const { sdk } = fakeSquare({ status: 'OK', token: CARD_TOKEN });
    const { bodies } = serve(() =>
      HttpResponse.json({ payment_id: 'p2', status: 'succeeded', entitlement: { plan: 'free', features: [] } }),
    );
    const onPurchased = vi.fn();
    renderCheckout({ sdk, onPurchased, productId: 'group_seat', quantity: 12, subjectId: 'g1' });

    expect(await screen.findByText(/A group seat × 12/)).toHaveTextContent('$24.00');
    fireEvent.click(screen.getByRole('button', { name: 'Pay $24.00' }));

    await waitFor(() => expect(onPurchased).toHaveBeenCalledOnce());
    expect(JSON.parse(bodies[0] ?? '{}')).toEqual({
      product_id: 'group_seat',
      payment_method_id: CARD_TOKEN,
      quantity: 12,
      subject_id: 'g1',
    });
    expect(screen.getByRole('status')).toHaveTextContent('Payment received for 12 × A group seat.');
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

describe('formatPrice', () => {
  it('formats prices in the product’s currency', () => {
    expect(formatPrice(REPORT)).toBe('$19.00');
    expect(formatPrice({ amount: '5', currency: 'CAD' })).toBe('CA$5.00');
    expect(formatPrice(SEAT, 'en-US', 3)).toBe('$6.00');
  });
});
