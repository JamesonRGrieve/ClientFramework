// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { toNavMenuItems } from './navigation';

const Icon = (): null => null;

describe('toNavMenuItems', () => {
  it('maps a flat entry to a menu item', () => {
    expect(toNavMenuItems([{ title: 'Analytics', url: '/analytics', icon: Icon }])).toEqual([
      { title: 'Analytics', url: '/analytics', icon: Icon },
    ]);
  });

  it('turns children into sub-items and omits absent icons', () => {
    expect(
      toNavMenuItems([
        {
          title: 'Billing',
          url: '/billing',
          children: [{ title: 'Invoices', url: '/billing/invoices' }],
        },
      ]),
    ).toEqual([{ title: 'Billing', url: '/billing', items: [{ title: 'Invoices', url: '/billing/invoices' }] }]);
  });

  it('adds no sub-items for an empty children list', () => {
    expect(toNavMenuItems([{ title: 'Docs', url: '/docs', children: [] }])).toEqual([{ title: 'Docs', url: '/docs' }]);
  });
});
