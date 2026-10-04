// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the health pages mount in the app (the extension's routes and links). */
export const HEALTH_PATH = '/health';

/** A record type's log page. */
export const recordsPath = (name: string): string => `${HEALTH_PATH}/${encodeURIComponent(name)}`;
