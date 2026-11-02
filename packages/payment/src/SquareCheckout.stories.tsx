// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withZephyrexApi } from 'zephyrex/testing';
import { type SquareCard, SquareCheckout, type SquareSdk } from './SquareCheckout';

const PAY = 'Pay $19.00';

const PRODUCTS = http.get('*/v1/entitlement/products', () =>
  HttpResponse.json({
    products: [
      { id: 'full_report', plan: 'report', amount: '19.00', currency: 'USD', description: 'The full report', features: [] },
    ],
  }),
);

/** Stands in for Square's card form: a plain box, and a token on demand. */
const fakeSdk = (status = 'OK'): SquareSdk => ({
  payments: () => ({
    card: async (): Promise<SquareCard> =>
      Promise.resolve({
        attach: async (element) => {
          if (element instanceof HTMLElement) {
            element.textContent = 'Card number · MM/YY · CVV';
          }
          return Promise.resolve();
        },
        tokenize: async () =>
          Promise.resolve(
            status === 'OK' ? { status, token: 'cnon:ok' } : { status, errors: [{ message: 'Card declined.' }] },
          ),
        destroy: async () => Promise.resolve(true),
      }),
  }),
});

const meta: Meta<typeof SquareCheckout> = {
  title: 'Payment/SquareCheckout',
  component: SquareCheckout,
  decorators: [withZephyrexApi],
  parameters: { msw: { handlers: [PRODUCTS] } },
  args: {
    applicationId: 'sandbox-sq0idb-story',
    locationId: 'L1',
    environment: 'sandbox',
    productId: 'full_report',
    loadSdk: async () => Promise.resolve(fakeSdk()),
    onPurchased: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof SquareCheckout>;

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('button', { name: PAY })).toBeEnabled();
  },
};

export const Paid: Story = {
  parameters: {
    msw: {
      handlers: [
        PRODUCTS,
        http.post('*/v1/entitlement/purchase', () =>
          HttpResponse.json({ payment_id: 'p1', status: 'succeeded', entitlement: { plan: 'report', features: [] } }),
        ),
      ],
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: PAY }));
    await expect(await canvas.findByText(/Payment received/)).toBeInTheDocument();
    await expect(args.onPurchased).toHaveBeenCalled();
  },
};

export const CardDeclined: Story = {
  args: { loadSdk: async () => Promise.resolve(fakeSdk('Invalid')) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: PAY }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Card declined.');
  },
};

export const NotConfigured: Story = { args: { applicationId: undefined, locationId: undefined } };
