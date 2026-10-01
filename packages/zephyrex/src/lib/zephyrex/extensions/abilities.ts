// SPDX-License-Identifier: AGPL-3.0-or-later
// Extensions that only expose abilities, which run server side (for agents and other extensions;
// no route invokes them). They have no client pages: their providers are configured on the
// provider pages, from each provider's settings catalogue.
import type { ZephyrexClientExtension } from '../types';
import { createExtension } from './createExtension';

const abilities = (name: string, displayName: string, description: string): ZephyrexClientExtension =>
  createExtension(name, { displayName, description });

export const cloudExtension = abilities('cloud', 'Cloud Storage', 'Files in S3, Azure Blob, GCS, Dropbox or Nextcloud');
export const mapsExtension = abilities('maps', 'Maps', 'Geocoding and routes through OpenStreetMap, Google or Apple Maps');
export const mathExtension = abilities('math', 'Math', 'Symbolic maths with SymPy, and Wolfram Alpha answers');
export const mediaExtension = abilities('media', 'Media', 'Film, television and video lookups through YouTube and TMDB');
export const messagingExtension = abilities(
  'messaging',
  'Messaging',
  'Chat messages through Discord, Slack, Telegram, Teams, WhatsApp, Messenger, Signal and TeamSpeak',
);
export const smsExtension = abilities('sms', 'SMS', 'Text messages through Twilio or Amazon SNS');
export const sourceExtension = abilities(
  'source',
  'Source Code',
  'Repositories on GitHub, Forgejo or Gitea, GitLab and Bitbucket',
);
export const wearableExtension = abilities('wearable', 'Wearables', 'Activity and health data from Fitbit');
export const wikiExtension = abilities('wiki', 'Wiki', 'Wikipedia, Fandom and Kanka lookups');

/** Every abilities-only extension, for the registry. */
export const abilityExtensions: readonly ZephyrexClientExtension[] = [
  cloudExtension,
  mapsExtension,
  mathExtension,
  mediaExtension,
  messagingExtension,
  smsExtension,
  sourceExtension,
  wearableExtension,
  wikiExtension,
];
