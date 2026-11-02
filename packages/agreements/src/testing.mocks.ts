// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { agreementsFixture, agreementsHandlers, type AgreementsStore, ME_ID } from './agreements.mocks';

/** Renders `ui` signed in as ME_ID under the Zephyrex test app, its requests answered over `store`. */
export function renderAgreements(ui: ReactElement, store: AgreementsStore = agreementsFixture()): RenderResult {
  withSession();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      fetchFrom([
        http.get('*/v1/user', () => HttpResponse.json({ user: { id: ME_ID, email: 'me@example.com' } })),
        ...agreementsHandlers(store),
      ]),
    ),
  );
  return render(createElement(TestWrapper, null, ui));
}

/** The item at `index`, failing the test when there is none. */
export function nth<T>(items: readonly T[], index: number): T {
  const item = items.at(index);
  if (item === undefined) {
    throw new Error(`Nothing at ${String(index)}`);
  }
  return item;
}
