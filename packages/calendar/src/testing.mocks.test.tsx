// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCalendarAccounts } from './calendarApi';
import { renderCalendar } from './testing.mocks';

function AccountCount(): string {
  return `${String(useCalendarAccounts().data?.length ?? -1)} calendars`;
}

describe('renderCalendar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signed in, answering /v1/calendars', async () => {
    const view = renderCalendar(<AccountCount />);
    expect(await view.findByText('1 calendars')).toBeInTheDocument();
  });
});
