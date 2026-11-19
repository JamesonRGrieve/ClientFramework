// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MeetMap, pointOf } from './MeetMap';
import type { Midpoint } from './mapsModel';

// Leaflet draws on a real canvas; here each call is recorded instead.
const leaflet = vi.hoisted(() => {
  interface Layer {
    addTo: () => Layer;
    bindTooltip: () => Layer;
  }
  const layer = (): Layer => {
    const stub: Layer = { addTo: () => stub, bindTooltip: () => stub };
    return stub;
  };
  const map = { remove: vi.fn(), fitBounds: vi.fn(), setView: vi.fn() };
  return {
    map,
    api: {
      map: vi.fn(() => map),
      tileLayer: vi.fn(layer),
      circleMarker: vi.fn(layer),
      polyline: vi.fn(layer),
      marker: vi.fn(layer),
      latLngBounds: vi.fn(() => {
        const corner = { equals: vi.fn(() => false) };
        return { extend: vi.fn(), getNorthEast: vi.fn(() => corner), getSouthWest: vi.fn(() => corner) };
      }),
    },
  };
});
vi.mock('leaflet', () => ({ default: leaflet.api }));

const MIDPOINT: Midpoint = {
  lat: 52.5,
  lon: -113.5,
  legs: [
    { location: '53.5461,-113.4938', straight_m: 1000 },
    { location: '200 Stephen Avenue, Calgary', straight_m: 1000 },
  ],
  places: [],
};

describe('pointOf', () => {
  it('reads "lat,lon" as a point, and anything else as no point', () => {
    expect(pointOf('53.5461, -113.4938')).toEqual([53.5461, -113.4938]);
    expect(pointOf('200 Stephen Avenue, Calgary')).toBeNull();
    expect(pointOf('95,10')).toBeNull();
  });
});

describe('MeetMap', () => {
  it('draws the middle, a line from each start given as a point, and lets the map go on unmount', async () => {
    const view = render(<MeetMap midpoint={MIDPOINT} labels={['Alex’s place', 'Sam’s place']} />);
    expect(screen.getByRole('img', { name: /Map of the middle/ })).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(leaflet.api.map).toHaveBeenCalledOnce();
    });
    // One start is coordinates, the other an address the map cannot place.
    expect(leaflet.api.polyline).toHaveBeenCalledOnce();
    view.unmount();
    expect(leaflet.map.remove).toHaveBeenCalled();
  });
});
