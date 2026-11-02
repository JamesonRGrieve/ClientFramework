// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { mediaFixture, mediaHandlers, type MediaStore } from './media.mocks';

/** Renders `ui` signed in under the Zephyrex test app, its requests answered by /v1/watch-lists over `store`. */
export function renderMedia(ui: ReactElement, store: MediaStore = mediaFixture()): RenderResult {
  withSession();
  vi.stubGlobal('fetch', vi.fn(fetchFrom(mediaHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}

/** `value`, failing the test when it is missing: a fixture's row the test relies on. */
export function present<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`The test expected ${what}`);
  }
  return value;
}
