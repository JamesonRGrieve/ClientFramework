// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { calendarExtension as registered } from 'zephyrex/extensions';
import { AvailabilityRoute, calendarExtension } from './extension';
import { renderCalendar } from './testing.mocks';

describe('calendarExtension', () => {
  it('is the registered calendar extension, with shared availability and a menu entry', () => {
    expect(calendarExtension).toMatchObject({ name: 'calendar', serverExtension: 'calendar' });
    expect(calendarExtension.displayName).toBe(registered.displayName);
    expect(calendarExtension.pages).toEqual([{ path: '/availability', component: AvailabilityRoute }]);
    expect(calendarExtension.navItems).toEqual([{ title: 'Shared availability', url: '/availability' }]);
  });

  it('mounts the page', async () => {
    const view = renderCalendar(createElement(AvailabilityRoute));
    expect(await view.findByRole('heading', { name: 'Shared availability', level: 1 })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
