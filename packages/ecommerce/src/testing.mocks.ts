// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { ecommerceHandlers, type StoreFixture, storeFixture } from './ecommerce.mocks';

/** Renders `ui` under the Zephyrex test app, its requests answered by the store routes over `fixture`. */
export function renderStore(ui: ReactElement, fixture: StoreFixture = storeFixture()): RenderResult {
  vi.stubGlobal('fetch', vi.fn(fetchFrom(ecommerceHandlers(fixture))));
  return render(createElement(TestWrapper, null, ui));
}
