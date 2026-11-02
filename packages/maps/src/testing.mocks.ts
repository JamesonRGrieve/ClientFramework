// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { mapsFixture, mapsHandlers, type MapsStore } from './maps.mocks';

/** Renders `ui` signed in under the Zephyrex test app, its requests answered by /v1/maps over `store`. */
export function renderMaps(ui: ReactElement, store: MapsStore = mapsFixture()): RenderResult {
  withSession();
  vi.stubGlobal('fetch', vi.fn(fetchFrom(mapsHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}
