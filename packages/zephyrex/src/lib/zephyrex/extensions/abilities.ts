// SPDX-License-Identifier: AGPL-3.0-or-later
// Extensions that only expose abilities, which run server side (for agents and other extensions;
// no route invokes them). They have no client pages: their providers are configured on the
// provider pages, from each provider's settings catalogue.
import type { ZephyrexClientExtension } from '../types';
import { createExtension } from './createExtension';

const abilities = (name: string, displayName: string, description: string): ZephyrexClientExtension =>
  createExtension(name, { displayName, description });

export const aiExtension = abilities('ai', 'AI', 'AI models through rotating providers');
export const automotiveExtension = abilities(
  'automotive',
  'Automotive',
  'Connected vehicles: state, locks, climate, charging and navigation',
);
export const cadExtension = abilities('cad', 'CAD', '3D model generation with CAD tools');
export const calendarExtension = abilities('calendar', 'Calendar', 'Scheduling and event management');
export const cloudExtension = abilities('cloud', 'Cloud Storage', 'Files in S3, Azure Blob, GCS, Dropbox or Nextcloud');
export const cryptoExtension = abilities('crypto', 'Crypto', 'Cryptocurrency and blockchain interactions');
export const fdmSlaPrintingExtension = abilities(
  'fdm_sla_printing',
  '3D Printing',
  'Monitoring and controlling FDM and SLA 3D printers',
);
export const localAiExtension = abilities(
  'local_ai',
  'Local AI',
  'Models run on this server, with hardware optimisation and request prioritisation',
);
export const localAiGgufExtension = abilities('local_ai_gguf', 'Local AI (GGUF)', 'Quantised GGUF models through llama.cpp');
export const localAiTorchExtension = abilities(
  'local_ai_torch',
  'Local AI (PyTorch)',
  'Transformer models through PyTorch and Hugging Face',
);
export const mcpClientExtension = abilities(
  'mcp_client',
  'MCP Client',
  'Tools and resources from Model Context Protocol servers',
);
export const websearchExtension = abilities('websearch', 'Web Search', 'Web search through several search engines');
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
  aiExtension,
  automotiveExtension,
  cadExtension,
  calendarExtension,
  cloudExtension,
  cryptoExtension,
  fdmSlaPrintingExtension,
  localAiExtension,
  localAiGgufExtension,
  localAiTorchExtension,
  mapsExtension,
  mathExtension,
  mcpClientExtension,
  mediaExtension,
  messagingExtension,
  smsExtension,
  sourceExtension,
  wearableExtension,
  websearchExtension,
  wikiExtension,
];
