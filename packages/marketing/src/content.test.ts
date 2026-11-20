// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Availability, Feature, Plan } from './content';

describe('landing content types', () => {
  it('limit availability to every edition or the hosted service', () => {
    expectTypeOf<Availability>().toEqualTypeOf<'everywhere' | 'hosted'>();
    expectTypeOf<Feature['availability']>().toEqualTypeOf<Availability>();
    expectTypeOf<Plan['cta']>().toEqualTypeOf<{ label: string; href: string }>();
    expect(true).toBe(true);
  });
});
