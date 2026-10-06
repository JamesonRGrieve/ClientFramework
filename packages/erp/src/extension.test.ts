// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { erpExtension as registered } from 'zephyrex/extensions';
import { DocTypePage } from './DocTypePage';
import { DocumentPage } from './DocumentPage';
import { ErpPage } from './ErpPage';
import { erpExtension } from './extension';

describe('erpExtension', () => {
  it('is the registered ERP extension, with its pages and a menu entry', () => {
    expect(erpExtension).toMatchObject({ name: 'erp', serverExtension: 'erp' });
    expect(erpExtension.displayName).toBe(registered.displayName);
    expect(erpExtension.pages).toEqual([
      { path: '/erp', component: ErpPage },
      { path: '/erp/:namespace/:slug', component: DocTypePage },
      { path: '/erp/:namespace/:slug/:name', component: DocumentPage },
    ]);
    expect(erpExtension.navItems).toEqual([{ title: 'ERP', url: '/erp' }]);
  });
});
