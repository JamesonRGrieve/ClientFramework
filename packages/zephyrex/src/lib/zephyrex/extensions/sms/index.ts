// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// Abilities only, run server side; its providers are configured on the provider pages.
export const smsExtension = createExtension('sms', {
  displayName: 'SMS',
  description: 'Text messages through Twilio or Amazon SNS',
});
