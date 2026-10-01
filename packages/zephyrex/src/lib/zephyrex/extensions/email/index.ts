// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const emailExtension = createExtension('email', {
  description: 'Email sending via SendGrid or other providers',
});
