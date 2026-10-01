// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { collectTabs } from '../ManagementTabRegistry';
import { metaSdkPyExtension } from './meta_sdk_py';
import { metaSdkRsExtension } from './meta_sdk_rs';
import { metaSdkTsExtension } from './meta_sdk_ts';
import { SDK_DOWNLOADS_TAB } from './sdkDownloadsTab';

const SDK_EXTENSIONS = [metaSdkPyExtension, metaSdkTsExtension, metaSdkRsExtension];

describe('SDK_DOWNLOADS_TAB', () => {
  it('is added by every SDK extension, for every signed-in user', () => {
    for (const extension of SDK_EXTENSIONS) {
      expect(extension.managementTabs).toEqual([SDK_DOWNLOADS_TAB]);
    }
    expect(SDK_DOWNLOADS_TAB.requireRole).toBeUndefined();
  });

  it('appears once however many SDK extensions the server has loaded', () => {
    expect(collectTabs(SDK_EXTENSIONS)).toEqual([SDK_DOWNLOADS_TAB]);
    expect(collectTabs([metaSdkRsExtension])).toEqual([SDK_DOWNLOADS_TAB]);
  });
});
