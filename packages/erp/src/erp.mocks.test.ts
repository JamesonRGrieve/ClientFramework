// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { erpFixture, erpHandlers, FIXTURE_VERSION, INSTANCE_ID, INVOICE } from './erp.mocks';

const BASE = 'http://localhost:1996';
const HTTP_NOT_FOUND = 404;
const HTTP_PRECONDITION_FAILED = 412;
const HTTP_UNPROCESSABLE = 422;
const HTTP_PRECONDITION_REQUIRED = 428;
const INVOICES = `${BASE}/v1/federated/erpnext_3f2a9c1d/sales_invoice`;

const post = (body: object, ifMatch?: string): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
  headers: ifMatch === undefined ? {} : { 'If-Match': ifMatch },
});

describe('the mock ERP server', () => {
  it('lists the catalogue, other federated sources’ types included', async () => {
    const serve = fetchFrom(erpHandlers());
    await expect((await serve(`${BASE}/v1/federated/catalogue`)).json()).resolves.toMatchObject({
      types: [{ name: 'Customer' }, { name: 'Sales Invoice' }, { namespace: 'wordpress_blog' }],
    });
  });

  it('pages a list, and answers a document that isn’t there with 404', async () => {
    const serve = fetchFrom(erpHandlers());
    await expect((await serve(`${INVOICES}/list`, post({ start: 1, page_length: 1 }))).json()).resolves.toMatchObject({
      items: [{ name: 'ACC-SINV-0002' }],
      start: 1,
      page_length: 1,
    });
    expect((await serve(`${INVOICES}/get`, post({ name: 'gone' }))).status).toBe(HTTP_NOT_FOUND);
    expect((await serve(`${INVOICES}/delete`, post({ name: 'gone' }, '"x"'))).status).toBe(HTTP_NOT_FOUND);
  });

  it('holds an update to the document’s version', async () => {
    const serve = fetchFrom(erpHandlers());
    const update = (ifMatch?: string): RequestInit => post({ name: INVOICE, data: { due_date: '2026-12-01' } }, ifMatch);
    expect((await serve(`${INVOICES}/update`, update())).status).toBe(HTTP_PRECONDITION_REQUIRED);
    expect((await serve(`${INVOICES}/update`, update(`"${FIXTURE_VERSION}"`))).ok).toBe(true);
    expect((await serve(`${INVOICES}/update`, update(`"${FIXTURE_VERSION}"`))).status).toBe(HTTP_PRECONDITION_FAILED);
  });

  it('submits only a draft and cancels only a submitted document', async () => {
    const store = erpFixture();
    const serve = fetchFrom(erpHandlers(store));
    const status = (name: string): RequestInit =>
      post({ provider_instance_id: INSTANCE_ID, doctype: 'Sales Invoice', name }, `"${FIXTURE_VERSION}"`);
    expect((await serve(`${BASE}/v1/erp/document/cancel`, status(INVOICE))).status).toBe(HTTP_UNPROCESSABLE);
    expect((await serve(`${BASE}/v1/erp/document/submit`, status('ACC-SINV-0002'))).status).toBe(HTTP_UNPROCESSABLE);
    expect((await serve(`${BASE}/v1/erp/document/submit`, status('gone'))).status).toBe(HTTP_NOT_FOUND);
    await expect((await serve(`${BASE}/v1/erp/document/submit`, status(INVOICE))).json()).resolves.toMatchObject({
      docstatus: 1,
    });
  });
});
