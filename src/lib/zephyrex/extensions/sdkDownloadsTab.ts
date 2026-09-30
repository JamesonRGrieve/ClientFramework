// SPDX-License-Identifier: AGPL-3.0-or-later
import { SdkDownloads } from '../components/SdkDownloads';
import type { ManagementTab } from '../types';

const SDK_DOWNLOADS_PRIORITY = 30;

/**
 * The account-page download list every SDK extension adds: one section, whichever of them the
 * server has loaded, since the list itself shows only the SDKs the server has generated.
 */
export const SDK_DOWNLOADS_TAB: ManagementTab = {
  id: 'sdk',
  label: 'Client SDKs',
  component: SdkDownloads,
  priority: SDK_DOWNLOADS_PRIORITY,
};
