// SPDX-License-Identifier: AGPL-3.0-or-later
/// <reference types="next/types/global" />
'use client';

import 'leaflet/dist/leaflet.css';
import { type ReactElement, useEffect, useRef } from 'react';
import type { Midpoint, Place } from './mapsModel';

/** OpenStreetMap's standard tiles, credited as its tile usage policy asks. */
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAX_ZOOM = 19;
const FIT_PADDING = 32;
const MIDDLE_ZOOM = 14;
const STRAIGHT = 'hsl(10 70% 55%)';
/** How far a latitude and a longitude can be from zero, in degrees. */
const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

/** One coordinate as typed ("-113.49"), in degrees; anything else is not one. */
function degreesOf(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '' || /[^\d.-]/u.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** A typed "lat,lon", as a point; anything else (an address) is not one. */
export function pointOf(location: string): [number, number] | null {
  const [latText = '', lonText = '', ...rest] = location.split(',');
  const lat = degreesOf(latText);
  const lon = degreesOf(lonText);
  if (rest.length > 0 || lat === null || lon === null) {
    return null;
  }
  return Math.abs(lat) <= MAX_LATITUDE && Math.abs(lon) <= MAX_LONGITUDE ? [lat, lon] : null;
}

/**
 * The middle on a map: the midpoint, the starting points given as coordinates (each with a line to
 * the middle), and the places to meet around it. Leaflet loads in the browser only, and the map is
 * released on unmount.
 */
export function MeetMap({
  midpoint,
  places = [],
  labels = [],
}: {
  midpoint: Midpoint;
  places?: readonly Place[];
  labels?: readonly string[];
}): ReactElement {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const life = { disposed: false };
    let release = (): void => undefined;
    void (async (): Promise<void> => {
      const L = (await import('leaflet')).default;
      if (life.disposed || element.current === null) {
        return;
      }
      const map = L.map(element.current, { scrollWheelZoom: false, attributionControl: true });
      release = () => map.remove();
      L.tileLayer(TILES, { maxZoom: MAX_ZOOM, attribution: ATTRIBUTION }).addTo(map);
      const middle: [number, number] = [midpoint.lat, midpoint.lon];
      const bounds = L.latLngBounds([middle]);
      L.circleMarker(middle, { radius: 9, color: STRAIGHT, weight: 3, fillOpacity: 0.9 })
        .bindTooltip('The middle', { permanent: true, direction: 'top' })
        .addTo(map);
      midpoint.legs.forEach((leg, index) => {
        const start = pointOf(leg.location);
        if (start === null) {
          return;
        }
        bounds.extend(start);
        L.polyline([start, middle], { color: STRAIGHT, weight: 2, dashArray: '6 6' }).addTo(map);
        L.circleMarker(start, { radius: 7, color: STRAIGHT, weight: 2, fillOpacity: 0.4 })
          .bindTooltip(labels[index] ?? leg.location)
          .addTo(map);
      });
      for (const place of places) {
        bounds.extend([place.lat, place.lon]);
        L.circleMarker([place.lat, place.lon], { radius: 5, weight: 1, fillOpacity: 0.7 })
          .bindTooltip(place.name)
          .addTo(map);
      }
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.setView(middle, MIDDLE_ZOOM);
      } else {
        map.fitBounds(bounds, { padding: [FIT_PADDING, FIT_PADDING] });
      }
    })();
    return () => {
      life.disposed = true;
      release();
    };
  }, [midpoint, places, labels]);
  return (
    <div
      ref={element}
      role='img'
      aria-label='Map of the middle, the starting points and places to meet'
      className='h-80 w-full overflow-hidden rounded-lg border xl:h-[28rem]'
    />
  );
}
