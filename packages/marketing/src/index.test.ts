// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as marketing from './index';

describe('@zephyrex/marketing', () => {
  it('exports the landing-page components', () => {
    expect(Object.keys(marketing).sort()).toEqual(
      [
        'ComparisonTable',
        'CtaBand',
        'FaqList',
        'FeatureCard',
        'Heading',
        'Hero',
        'PricingCard',
        'Section',
        'SiteFooter',
        'SiteHeader',
        'subLevel',
        'WAITLIST_PATH',
        'WaitlistForm',
        'createWaitlistRoute',
      ].sort(),
    );
  });
});
