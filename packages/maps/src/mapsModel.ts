// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's maps extension answers (/v1/maps): places, the kinds of place it finds, and
// the point halfway between several locations with each one's way there.
import { z } from 'zod';

/** How people travel there, as the server routes them. */
export const MODES = [
  { mode: 'driving', label: 'Driving' },
  { mode: 'walking', label: 'Walking' },
  { mode: 'bicycling', label: 'Cycling' },
  { mode: 'transit', label: 'Transit' },
] as const;
export type Mode = (typeof MODES)[number]['mode'];

/** The most places one midpoint is found between (MAX_MIDPOINT_LOCATIONS). */
export const MAX_LOCATIONS = 8;

export const PlaceSchema = z.object({
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lon: z.number(),
  id: z.string(),
  distance_m: z.number().nullish(),
  category: z.string().nullish(),
  website: z.string().nullish(),
  phone: z.string().nullish(),
  opening_hours: z.string().nullish(),
});
export type Place = z.infer<typeof PlaceSchema>;

export const CategorySchema = z.object({ name: z.string(), title: z.string() });
export type PlaceCategory = z.infer<typeof CategorySchema>;

const LegSchema = z.object({
  location: z.string(),
  straight_m: z.number(),
  distance_m: z.number().nullish(),
  duration_s: z.number().nullish(),
});
export type Leg = z.infer<typeof LegSchema>;

export const MidpointSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  legs: z.array(LegSchema),
  places: z.array(PlaceSchema),
});
export type Midpoint = z.infer<typeof MidpointSchema>;

/** A place someone can pick to meet between: what to call it, and where it is (an address or "lat,lon"). */
export interface KnownPlace {
  label: string;
  location: string;
}

const METRES_PER_KM = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const MAP_ZOOM = 16;

/** A distance for people: metres close by, kilometres further. */
export function distanceLabel(metres: number): string {
  return metres < METRES_PER_KM ? `${String(Math.round(metres))} m` : `${(metres / METRES_PER_KM).toFixed(1)} km`;
}

/** A journey's length for people: "25 min", "1 h 5 min". */
export function durationLabel(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / SECONDS_PER_MINUTE));
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === 0) {
    return `${String(minutes)} min`;
  }
  return rest === 0 ? `${String(hours)} h` : `${String(hours)} h ${String(rest)} min`;
}

/** The point on OpenStreetMap's own map. */
export function mapLink(point: { lat: number; lon: number }): string {
  const lat = String(point.lat);
  const lon = String(point.lon);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${String(MAP_ZOOM)}/${lat}/${lon}`;
}
