// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { SDK_DOWNLOADS_TAB } from '../sdkDownloadsTab';

export const metaSdkPyExtension = createExtension('meta_sdk_py', {
  displayName: 'Python SDK',
  description: 'Generated typed Python client for this server',
  managementTabs: [SDK_DOWNLOADS_TAB],
});
