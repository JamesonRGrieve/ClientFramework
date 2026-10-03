// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the social pages mount in the app (the extension's routes and links). */
export const SOCIAL_PATH = '/social';

export const publicationPath = (publicationId: string): string => `${SOCIAL_PATH}/${encodeURIComponent(publicationId)}`;
