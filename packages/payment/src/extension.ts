// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement } from 'react';
import type { ZephyrexClientExtension } from 'zephyrex';
import { paymentExtension as registered } from 'zephyrex/extensions';
import { type StripePricingTable, Subscribe } from './Subscribe';

/**
 * The payment client extension for an app's `extensions`, with the app's pricing table (read from
 * its own configuration, e.g. `paymentExtension({ pricingTableId: process.env.NEXT_PUBLIC_… })`).
 * It adds the page a user without a subscription lands on (`<authPath>/subscribe`), where the auth
 * middleware sends a 402 from the server. The page is not session-only: the session check
 * answering 402 there would send the user to it again.
 */
export function paymentExtension(pricingTable: StripePricingTable = {}): ZephyrexClientExtension {
  const SubscribePage = (): ReactElement => createElement(Subscribe, pricingTable);
  return { ...registered, authPages: [{ path: '/subscribe', component: SubscribePage }] };
}
