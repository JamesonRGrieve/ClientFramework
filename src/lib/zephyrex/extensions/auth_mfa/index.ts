// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, lazy, type ReactElement } from 'react';
import { useZephyrexConfig } from '../../ZephyrexProvider';
import { createExtension } from '../createExtension';

const MfaSettings = lazy(async () =>
  import('@zephyrex/auth/mfa/MfaSettings').then((loaded) => ({ default: loaded.MfaSettings })),
);

/** Two-factor setup against this app's server. */
function MfaSettingsSection(): ReactElement {
  const { config } = useZephyrexConfig();
  return createElement(MfaSettings, { authServer: config.server.baseUrl });
}

export const authMfaExtension = createExtension('auth_mfa', {
  displayName: 'Multi-Factor Authentication',
  description: 'TOTP, email, and SMS verification',
  managementTabs: [{ id: 'mfa', label: 'Two-factor authentication', component: MfaSettingsSection, priority: 20 }],
});
