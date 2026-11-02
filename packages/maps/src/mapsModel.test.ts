// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { distanceLabel, durationLabel, mapLink, MidpointSchema } from './mapsModel';

describe('the maps model', () => {
  it('gives distances in metres close by and kilometres further', () => {
    expect(distanceLabel(420.4)).toBe('420 m');
    expect(distanceLabel(140_512)).toBe('140.5 km');
  });

  it('gives journeys in minutes, then hours and minutes', () => {
    expect(durationLabel(20)).toBe('1 min');
    expect(durationLabel(1500)).toBe('25 min');
    expect(durationLabel(3600)).toBe('1 h');
    expect(durationLabel(3900)).toBe('1 h 5 min');
  });

  it('links a point on OpenStreetMap', () => {
    expect(mapLink({ lat: 52.3, lon: -113.8 })).toBe(
      'https://www.openstreetmap.org/?mlat=52.3&mlon=-113.8#map=16/52.3/-113.8',
    );
  });

  it('reads a midpoint whose legs had no route', () => {
    const read = MidpointSchema.parse({
      lat: 1,
      lon: 2,
      legs: [{ location: 'a', straight_m: 5, distance_m: null }],
      places: [],
    });
    expect(read.legs[0]?.duration_s).toBeUndefined();
  });
});
