// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { loaded, TestWrapper, testConfig } from 'zephyrex/testing';
import { type Call, writesOf } from 'zephyrex/testing/msw';
import {
  CUSTOMER,
  CUSTOMER_TYPE,
  documentOf,
  erpFixture,
  FIXTURE_VERSION,
  INSTANCE_ID,
  INVOICE,
  INVOICE_TYPE,
} from './erp.mocks';
import { createDocument, type ErpDocument, useDocTypes, useDocument, useDocumentActions, useDocuments } from './erpApi';
import { recordCalls } from './testing.mocks';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
const LOADED = `"${FIXTURE_VERSION}"`;
/** The typed models' reads, which are POSTs too. */
const READS = /\/(get|list)$/;

describe('the ERP API', () => {
  let store = erpFixture();
  let calls: Call[] = [];

  beforeEach(() => {
    store = erpFixture();
    calls = recordCalls(store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the ERPNext DocTypes alone from the catalogue, by instance then name', async () => {
    expect((await loaded(() => useDocTypes())).map(({ name }) => name)).toEqual(['Customer', 'Sales Invoice']);
  });

  it('reads a page of documents, and one document or null', async () => {
    const page = await loaded(() => useDocuments(CUSTOMER_TYPE, 0));
    expect(page).toMatchObject({ start: 0, page_length: 20 });
    expect(page.items.map(({ name }) => name)).toEqual([CUSTOMER, 'Globex']);
    expect(await loaded(() => useDocument(INVOICE_TYPE, INVOICE))).toMatchObject({ name: INVOICE, customer: CUSTOMER });
    expect(await loaded(() => useDocument(INVOICE_TYPE, 'gone'))).toBeNull();
    expect(writesOf(calls).map(([method, path, body]) => [method, path, body])).toEqual([
      ['POST', '/v1/federated/erpnext_3f2a9c1d/customer/list', '{"start":0,"page_length":20,"order_by":"modified desc"}'],
      ['POST', '/v1/federated/erpnext_3f2a9c1d/sales_invoice/get', `{"name":"${INVOICE}"}`],
      ['POST', '/v1/federated/erpnext_3f2a9c1d/sales_invoice/get', '{"name":"gone"}'],
    ]);
  });

  it('creates a document, and saves, submits, cancels and deletes one guarded by it as loaded', async () => {
    await expect(createDocument(client, CUSTOMER_TYPE, { customer_name: 'Initech' })).resolves.toMatchObject({
      name: 'NEW-1',
    });
    const invoiceNow = (): ErpDocument => documentOf(store, 'sales_invoice', INVOICE);
    const invoice = renderHook(() => useDocumentActions(INVOICE_TYPE, INVOICE), { wrapper: TestWrapper }).result;
    await expect(invoice.current.save.save(invoiceNow(), { due_date: '2026-12-01' })).resolves.toBe(true);
    const saved = invoiceNow();
    await expect(invoice.current.submit.save(saved, {})).resolves.toBe(true);
    const submitted = invoiceNow();
    await expect(invoice.current.cancel.save(submitted, {})).resolves.toBe(true);
    const customer = renderHook(() => useDocumentActions(CUSTOMER_TYPE, 'Globex'), { wrapper: TestWrapper }).result;
    await expect(customer.current.remove.save(documentOf(store, 'customer', 'Globex'), {})).resolves.toBe(true);
    expect(writesOf(calls).filter(([, path]) => !READS.test(path))).toEqual([
      ['POST', '/v1/federated/erpnext_3f2a9c1d/customer/create', '{"data":{"customer_name":"Initech"}}', null],
      [
        'POST',
        '/v1/federated/erpnext_3f2a9c1d/sales_invoice/update',
        `{"name":"${INVOICE}","data":{"due_date":"2026-12-01"}}`,
        LOADED,
      ],
      [
        'POST',
        '/v1/erp/document/submit',
        `{"provider_instance_id":"${INSTANCE_ID}","doctype":"Sales Invoice","name":"${INVOICE}"}`,
        `"${String(saved.updated_at)}"`,
      ],
      [
        'POST',
        '/v1/erp/document/cancel',
        `{"provider_instance_id":"${INSTANCE_ID}","doctype":"Sales Invoice","name":"${INVOICE}"}`,
        `"${String(submitted.updated_at)}"`,
      ],
      ['POST', '/v1/federated/erpnext_3f2a9c1d/customer/delete', '{"name":"Globex"}', LOADED],
    ]);
    expect(invoiceNow().docstatus).toBe(2);
  });
});
