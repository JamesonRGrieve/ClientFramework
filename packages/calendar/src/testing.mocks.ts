// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { calendarFixture, calendarHandlers, type CalendarStore } from './calendar.mocks';

/** Renders `ui` signed in under the Zephyrex test app, its requests answered by /v1/calendars over `store`. */
export function renderCalendar(ui: ReactElement, store: CalendarStore = calendarFixture()): RenderResult {
  withSession();
  vi.stubGlobal('fetch', vi.fn(fetchFrom(calendarHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}
