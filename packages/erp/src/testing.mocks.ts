// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's test helpers (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { type Call, recordingFetch } from 'zephyrex/testing/msw';
import { erpFixture, erpHandlers, type ErpStore } from './erp.mocks';
import type { FormValues } from './schemaFields';

/** Answers every request from the ERP routes over `store`, recording each into the list returned. */
export function recordCalls(store: ErpStore): Call[] {
  const recorded = recordingFetch(erpHandlers(store));
  vi.stubGlobal('fetch', vi.fn(recorded.fetch));
  return recorded.calls;
}

/** Renders `ui` under the Zephyrex test app, its requests answered by the ERP routes over `store`. */
export function renderErp(ui: ReactElement, store: ErpStore = erpFixture()): RenderResult {
  recordCalls(store);
  return render(createElement(TestWrapper, null, ui));
}

/** The rows of the table `name` in `values`; a test naming a field that isn't a table is wrong. */
export function rowsOf(values: Readonly<FormValues>, name: string): FormValues[] {
  const rows = values[name];
  if (!Array.isArray(rows)) {
    throw new Error(`${name} is not a table`);
  }
  return rows;
}
