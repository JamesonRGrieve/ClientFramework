// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { healthExtension as registered } from 'zephyrex/extensions';
import { healthExtension } from './extension';
import { HealthPage } from './HealthPage';
import { RecordsPage } from './RecordsPage';

describe('healthExtension', () => {
  it('is the registered health extension, with the health pages and a menu entry', () => {
    expect(healthExtension).toMatchObject({ name: 'health', serverExtension: 'health' });
    expect(healthExtension.displayName).toBe(registered.displayName);
    expect(healthExtension.pages).toEqual([
      { path: '/health', component: HealthPage },
      { path: '/health/:kind', component: RecordsPage },
    ]);
    expect(healthExtension.navItems).toEqual([{ title: 'Health', url: '/health' }]);
  });
});
