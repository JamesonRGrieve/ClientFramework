// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory /v1/maps for the package's tests and stories (never compiled into dist): the kinds
// of place, and a midpoint between whatever is asked, as the server works it out for two points.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { z } from 'zod';
import type { Midpoint, Place, PlaceCategory } from './mapsModel';

const HTTP_UNPROCESSABLE = 422;
/** A leg's journey, by how many places were asked for: the second takes longer than the first. */
const MINUTES_PER_LEG = 20;
const SECONDS_PER_MINUTE = 60;
const METRES_PER_LEG = 30_000;

const CATEGORIES: PlaceCategory[] = [
  { name: 'cafe', title: 'Cafés' },
  { name: 'park', title: 'Parks and gardens' },
  { name: 'restaurant', title: 'Restaurants' },
];

export const PLACES: Place[] = [
  {
    name: 'The Halfway House',
    address: '1 Main Street, Red Deer',
    lat: 52.27,
    lon: -113.81,
    id: 'node/1',
    distance_m: 350,
    category: 'restaurant',
    website: 'https://halfway.example.org',
  },
  {
    name: 'Ross Street Café',
    address: '',
    lat: 52.268,
    lon: -113.812,
    id: 'node/2',
    distance_m: 900,
    category: 'restaurant',
  },
];

/** What the mock server holds: the places it finds, whether routes are found, and what it was asked. */
export interface MapsStore {
  places: Place[];
  routed: boolean;
  asked: { locations: string[]; mode: string; category: string | null }[];
  /** The kinds of place searched for nearby. */
  nearby: string[];
}

export function mapsFixture(): MapsStore {
  return { places: PLACES.map((place) => ({ ...place })), routed: true, asked: [], nearby: [] };
}

const Asked = z.object({ locations: z.array(z.string()), mode: z.string(), category: z.string().nullable() });

export function mapsHandlers(store: MapsStore = mapsFixture()): RequestHandler[] {
  return [
    http.get('*/v1/maps/nearby', ({ request }) => {
      const category = new URL(request.url).searchParams.get('category');
      store.nearby.push(category ?? '');
      return HttpResponse.json({ places: store.places.filter((place) => place.category === category) });
    }),
    http.get('*/v1/maps/categories', () => HttpResponse.json({ categories: CATEGORIES })),
    http.post('*/v1/maps/midpoint', async ({ request }) => {
      const asked = Asked.parse(await request.json());
      store.asked.push(asked);
      if (asked.locations.some((location) => location.toLowerCase().includes('nowhere'))) {
        return HttpResponse.json({ detail: { message: "No place found for 'Nowhere'" } }, { status: HTTP_UNPROCESSABLE });
      }
      const midpoint: Midpoint = {
        lat: 52.27,
        lon: -113.81,
        legs: asked.locations.map((location, index) => ({
          location,
          straight_m: 140_000,
          distance_m: store.routed ? METRES_PER_LEG * (index + 1) : null,
          duration_s: store.routed ? MINUTES_PER_LEG * SECONDS_PER_MINUTE * (index + 1) : null,
        })),
        places: asked.category === null ? [] : store.places.filter((place) => place.category === asked.category),
      };
      return HttpResponse.json(midpoint);
    }),
  ];
}
