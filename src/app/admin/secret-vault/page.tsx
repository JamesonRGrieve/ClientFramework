// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX } from 'react';
import { RootProviderStatus } from 'zephyrex';
import { SidebarPage } from 'zephyrex/components/appwrapper/src/SidebarPage';

const SECRET_VAULT_EXTENSION = 'secret_vault';

export default function SecretVaultPage(): JSX.Element {
  return (
    <SidebarPage title='Secret Vault'>
      <RootProviderStatus extension={SECRET_VAULT_EXTENSION} health />
    </SidebarPage>
  );
}
