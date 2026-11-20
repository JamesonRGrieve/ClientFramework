// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { FAQS, FEATURE_EVERYWHERE, FEATURE_HOSTED, FOOTER, NAV, PLAN_FREE, PLAN_PRO } from './marketing.mocks';

describe('marketing fixtures', () => {
  it('cover both availabilities, a highlighted plan, and unique keys', () => {
    expect([FEATURE_EVERYWHERE.availability, FEATURE_HOSTED.availability]).toEqual(['everywhere', 'hosted']);
    expect([PLAN_FREE.highlighted, PLAN_PRO.highlighted]).toEqual([undefined, true]);
    expect(new Set(FAQS.map((faq) => faq.question)).size).toBe(FAQS.length);
    expect(new Set(NAV.map((link) => link.href)).size).toBe(NAV.length);
    expect(FOOTER.flatMap((column) => column.links).length).toBeGreaterThan(0);
  });
});
