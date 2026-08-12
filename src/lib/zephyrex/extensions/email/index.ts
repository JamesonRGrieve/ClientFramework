// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const emailExtension: ZephyrexClientExtension = {
  name: 'email',
  displayName: 'Email',
  description: 'Email sending via SendGrid or other providers',
  serverExtension: 'email',
  // Email is a server-side provider. Admin configuration via
  // provider settings at /settings/extensions.
};
