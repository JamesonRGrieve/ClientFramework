// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const secretVaultExtension = createExtension('secret_vault', {
  displayName: 'Secret Vault',
  description: 'Secret-vault provider status',
});
