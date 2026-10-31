// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { TIE_LEGEND } from './legend';
import { FAMILY_TREE } from './options';

describe('FAMILY_TREE', () => {
  it('is a family history: lineage and GEDCOM shown, circles walked through partnerships', () => {
    expect(FAMILY_TREE).toEqual({
      tree: 'Family tree',
      lineage: true,
      gedcom: true,
      circleKinds: ['partnership'],
      legend: TIE_LEGEND,
    });
  });
});
