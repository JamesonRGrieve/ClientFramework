// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/erp', () => {
  it('publishes the pages, the reads and writes behind them, and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'DocTypePage',
        'DocTypeSchema',
        'DocumentPage',
        'DocumentSchema',
        'ERP_PATH',
        'ErpPage',
        'createDocument',
        'docTypePath',
        'documentPath',
        'erpExtension',
        'useDocTypes',
        'useDocument',
        'useDocumentActions',
        'useDocuments',
      ].sort(),
    );
  });
});
