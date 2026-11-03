// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { agreementsFixture, agreementsHandlers, settled } from './agreements.mocks';
import { nth } from './testing.mocks';

describe('the agreements mock', () => {
  it('answers every agreements route', () => {
    expect(agreementsHandlers()).toHaveLength(10);
  });

  it('settles the fixture the way the server does', () => {
    const { agreements } = agreementsFixture();
    const ours = nth(agreements, 0);
    const household = nth(agreements, 1);
    expect(ours.in_effect).toBe(true);
    expect(household.in_effect).toBe(false);
    expect(settled(household).parties.map((p) => p.confirmed)).toEqual([true, true, false]);
  });
});
