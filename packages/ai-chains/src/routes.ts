// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the chain pages mount in the app (the extension's routes and links). */
export const CHAINS_PATH = '/chains';

export const chainPagePath = (chainId: string): string => `${CHAINS_PATH}/${encodeURIComponent(chainId)}`;
