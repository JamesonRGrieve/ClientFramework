// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { docTypePath, documentPath, ERP_PATH } from './routes';

describe('ERP routes', () => {
  it('puts a DocType under its namespace and slug, and a document under its DocType, names escaped', () => {
    const invoices = { namespace: 'erpnext_3f2a9c1d', slug: 'sales_invoice' };
    expect(ERP_PATH).toBe('/erp');
    expect(docTypePath(invoices)).toBe('/erp/erpnext_3f2a9c1d/sales_invoice');
    expect(documentPath(invoices, 'ACC/SINV 1')).toBe('/erp/erpnext_3f2a9c1d/sales_invoice/ACC%2FSINV%201');
  });
});
