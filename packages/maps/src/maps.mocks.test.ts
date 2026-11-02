// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { MidpointSchema } from './mapsModel';
import { mapsFixture, PLACES } from './maps.mocks';

describe('the maps mock', () => {
  it('gives each fixture its own places', () => {
    const one = mapsFixture();
    one.places.pop();
    expect(mapsFixture().places).toHaveLength(PLACES.length);
  });

  it('holds places a midpoint answer can carry', () => {
    expect(() => MidpointSchema.parse({ lat: 0, lon: 0, legs: [], places: PLACES })).not.toThrow();
  });
});
