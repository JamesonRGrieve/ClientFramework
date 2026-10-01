// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { SDK_DOWNLOADS_TAB } from '../sdkDownloadsTab';

export const metaSdkTsExtension = createExtension('meta_sdk_ts', {
  displayName: 'TypeScript SDK',
  description: 'Generated typed TypeScript client for this server',
  managementTabs: [SDK_DOWNLOADS_TAB],
});
