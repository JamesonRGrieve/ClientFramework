// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { paymentExtension as registered } from 'zephyrex/extensions';
import { paymentExtension } from './extension';

describe('paymentExtension', () => {
  it('is the registered payment extension, with the subscribe page open to the 402 redirect', () => {
    const extension = paymentExtension();
    expect(extension).toMatchObject({ name: 'payment', serverExtension: 'payment' });
    expect(extension.displayName).toBe(registered.displayName);
    expect(extension.authPages?.map(({ path, requiresSession }) => ({ path, requiresSession }))).toEqual([
      { path: '/subscribe', requiresSession: undefined },
    ]);
  });

  it('mounts the subscribe page with the app’s pricing table', () => {
    const pages = paymentExtension({ pricingTableId: 'prctbl_1', publishableKey: 'pk_1' }).authPages ?? [];
    expect(pages).toHaveLength(1);
    const tables = pages.map(({ component }) =>
      render(createElement(component)).container.querySelector('stripe-pricing-table'),
    );
    expect(tables.map((table) => table?.getAttribute('pricing-table-id'))).toEqual(['prctbl_1']);
    expect(tables.map((table) => table?.getAttribute('publishable-key'))).toEqual(['pk_1']);
  });
});
