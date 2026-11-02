// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { giftsFixture, giftsHandlers, type GiftsStore } from './gifts.mocks';

/** Renders `ui` signed in under the Zephyrex test app, its requests answered by the gifts routes over `store`. */
export function renderGifts(ui: ReactElement, store: GiftsStore = giftsFixture()): RenderResult {
  withSession();
  vi.stubGlobal('fetch', vi.fn(fetchFrom(giftsHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}
