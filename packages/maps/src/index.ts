// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's maps extension (zephyrex[maps]): the point halfway between
// people, their ways there, and places to meet around it.
export { mapsExtension } from './extension';
export { findMidpoint, MAPS_ENDPOINT, usePlaceCategories } from './mapsApi';
export type { MidpointRequest } from './mapsApi';
export { distanceLabel, durationLabel, mapLink, MidpointSchema, MODES, PlaceSchema } from './mapsModel';
export type { KnownPlace, Leg, Midpoint, Mode, Place, PlaceCategory } from './mapsModel';
export { MeetInTheMiddle } from './MeetInTheMiddle';
export type { MeetInTheMiddleProps } from './MeetInTheMiddle';
export { MEET_PATH } from './routes';
