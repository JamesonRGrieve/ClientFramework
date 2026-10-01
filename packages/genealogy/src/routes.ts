// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the genealogy pages mount in the app (the extension's routes and links). */
export const GENEALOGY_PATH = '/genealogy';

export const personPath = (personId: string): string => `${GENEALOGY_PATH}/${encodeURIComponent(personId)}`;
