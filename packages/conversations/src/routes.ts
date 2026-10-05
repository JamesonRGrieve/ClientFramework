// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the conversation pages mount in the app (the extension's routes and links). */
export const CONVERSATIONS_PATH = '/conversations';

export const conversationPagePath = (conversationId: string): string =>
  `${CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}`;
