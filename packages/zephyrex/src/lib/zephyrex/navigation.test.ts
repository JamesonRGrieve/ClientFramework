// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { sameChildren, toNavMenuItems } from './navigation';

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

  it('puts the entry’s computed sub-items after its own', () => {
    const list = '/campaigns';
    const computed = new Map([['Campaigns', [{ title: 'The Koronus Run', url: '/campaign/k1' }]]]);
    expect(toNavMenuItems([{ title: 'Campaigns', url: list, children: [{ title: 'All', url: list }] }], computed)).toEqual([
      {
        title: 'Campaigns',
        url: list,
        items: [
          { title: 'All', url: list },
          { title: 'The Koronus Run', url: '/campaign/k1' },
        ],
      },
    ]);
  });
});

describe('sameChildren', () => {
  it('compares computed sub-items by title and address, in order', () => {
    const one = { title: 'A', url: '/a' };
    const two = { title: 'B', url: '/b' };
    expect(sameChildren([one, two], [{ ...one }, { ...two }])).toBe(true);
    expect(sameChildren([one, two], [two, one])).toBe(false);
    expect(sameChildren([one], [])).toBe(false);
  });
});
