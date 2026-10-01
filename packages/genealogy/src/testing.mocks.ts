// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { familyFixture, fetchFrom, genealogyHandlers, type Store } from './genealogy.mocks';

/** Renders `ui` under the Zephyrex test app, its requests answered by the genealogy routes over `store`. */
export function renderGenealogy(ui: ReactElement, store: Store = familyFixture()): RenderResult {
  vi.stubGlobal('fetch', vi.fn(fetchFrom(genealogyHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}
