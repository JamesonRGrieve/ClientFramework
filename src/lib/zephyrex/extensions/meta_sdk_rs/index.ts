// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { SDK_DOWNLOADS_TAB } from '../sdkDownloadsTab';

export const metaSdkRsExtension = createExtension('meta_sdk_rs', {
  displayName: 'Rust SDK',
  description: 'Generated typed Rust client for this server',
  managementTabs: [SDK_DOWNLOADS_TAB],
});
