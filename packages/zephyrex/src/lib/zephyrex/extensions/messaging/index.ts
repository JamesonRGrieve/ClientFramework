// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// Abilities only, run server side; its providers are configured on the provider pages.
export const messagingExtension = createExtension('messaging', {
  displayName: 'Messaging',
  description: 'Chat messages through Discord, Slack, Telegram, Teams, WhatsApp, Messenger, Signal and TeamSpeak',
});
