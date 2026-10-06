// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory ERP server for the package's tests and stories (never compiled into dist): one
// operator ERPNext instance whose Customer and Sales Invoice (with item rows) are served as the
// server's typed models (the catalogue, then list, get, create, update and delete, each change held
// to the document's version), and the generic API's submit and cancel. Another federated source's
// type is in the catalogue too, as on a server that federates more than ERPNext.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { notFound, refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import {
  CATALOGUE_ENDPOINT,
  type DocType,
  DOCUMENT_ENDPOINT,
  DocumentSchema,
  type ErpDocument,
  type Operation,
  PAGE_LENGTH,
} from './erpApi';
import type { JsonSchema, JsonValue } from './schemaFields';

/** When the fixture's documents were saved: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01 09:00:00.000001';
export const INSTANCE_ID = '3f2a9c1d-0000-4000-8000-000000000001';
export const NAMESPACE = 'erpnext_3f2a9c1d';
export const INVOICE = 'ACC-SINV-0001';
export const CUSTOMER = 'Acme Ltd';

const DRAFT = 0;
const SUBMITTED = 1;
const CANCELLED = 2;
const HTTP_UNPROCESSABLE = 422;
const CREDIT_LIMIT = 5000;
const WIDGET_RATE = 10.5;
const GADGET_RATE = 99;
const WRONG_STATUS: Readonly<Record<'submit' | 'cancel', string>> = {
  submit: 'Only a draft can be submitted.',
  cancel: 'Only a submitted document can be cancelled.',
};

const nullable = (type: string, title: string): JsonSchema => ({ anyOf: [{ type }, { type: 'null' }], title });

const CUSTOMER_WRITE: JsonSchema = {
  type: 'object',
  properties: {
    customer_name: nullable('string', 'Customer Name'),
    customer_group: nullable('string', 'Customer Group'),
    credit_limit: nullable('number', 'Credit Limit'),
  },
};

const INVOICE_WRITE: JsonSchema = {
  type: 'object',
  $defs: {
    SalesInvoiceItem: {
      type: 'object',
      properties: {
        item_code: nullable('string', 'Item Code'),
        qty: nullable('integer', 'Qty'),
        rate: nullable('number', 'Rate'),
      },
    },
  },
  properties: {
    customer: nullable('string', 'Customer'),
    due_date: nullable('string', 'Due Date'),
    items: { anyOf: [{ type: 'array', items: { $ref: '#/$defs/SalesInvoiceItem' } }, { type: 'null' }], title: 'Items' },
  },
};

const OPERATIONS: readonly Operation[] = ['list', 'get', 'create', 'update', 'delete'];

const docType = (name: string, slug: string, write: JsonSchema): DocType => ({
  namespace: NAMESPACE,
  source: 'ERPNext acme-production',
  source_reference: INSTANCE_ID,
  name,
  slug,
  key_field: 'name',
  version_field: 'updated_at',
  operations: [...OPERATIONS],
  rest: Object.fromEntries(OPERATIONS.map((operation) => [operation, `/v1/federated/${NAMESPACE}/${slug}/${operation}`])),
  record_schema: write,
  write_schema: write,
});

export const CUSTOMER_TYPE = docType('Customer', 'customer', CUSTOMER_WRITE);
export const INVOICE_TYPE = docType('Sales Invoice', 'sales_invoice', INVOICE_WRITE);
/** A type of another federated source, which the ERP pages leave out. */
const WORDPRESS_TYPE: DocType = {
  ...CUSTOMER_TYPE,
  namespace: 'wordpress_blog',
  source: 'WordPress blog',
  name: 'Post',
  slug: 'post',
};

export interface ErpStore {
  docTypes: DocType[];
  /** Each DocType's documents, by slug. */
  documents: Map<string, ErpDocument[]>;
}

/** A document as the site saved it, a draft unless `fields` say otherwise. */
const saved = (name: string, fields: Record<string, JsonValue>): ErpDocument =>
  DocumentSchema.parse({ name, docstatus: DRAFT, updated_at: FIXTURE_VERSION, modified: FIXTURE_VERSION, ...fields });

/** `document` saved again with `changes`, at a new version. */
const resaved = (document: ErpDocument, changes: Record<string, JsonValue>): ErpDocument => {
  const stamp = versionStamp();
  return DocumentSchema.parse({ ...document, ...changes, updated_at: stamp, modified: stamp });
};

/** `store`'s documents of the DocType `slug`. */
export const documentsOf = (store: ErpStore, slug: string): ErpDocument[] => store.documents.get(slug) ?? [];

/** The document `name` of the DocType `slug` in `store`; a test naming one that isn't there is wrong. */
export function documentOf(store: ErpStore, slug: string, name: string): ErpDocument {
  const found = documentsOf(store, slug).find((document) => document.name === name);
  if (found === undefined) {
    throw new Error(`No ${slug} ${name} in the fixture`);
  }
  return found;
}

/** Two customers; a draft invoice with two item rows, and a submitted one. */
export function erpFixture(): ErpStore {
  return {
    docTypes: [CUSTOMER_TYPE, INVOICE_TYPE, WORDPRESS_TYPE],
    documents: new Map([
      [
        'customer',
        [
          saved(CUSTOMER, { customer_name: 'Acme Ltd', customer_group: 'Commercial', credit_limit: CREDIT_LIMIT }),
          saved('Globex', { customer_name: 'Globex', customer_group: 'Commercial', credit_limit: null }),
        ],
      ],
      [
        'sales_invoice',
        [
          saved(INVOICE, {
            customer: CUSTOMER,
            due_date: '2026-10-31',
            items: [
              { name: 'row-1', idx: 1, item_code: 'WIDGET', qty: 2, rate: WIDGET_RATE },
              { name: 'row-2', idx: 2, item_code: 'GADGET', qty: 1, rate: GADGET_RATE },
            ],
          }),
          saved('ACC-SINV-0002', { customer: 'Globex', due_date: '2026-11-15', items: [], docstatus: SUBMITTED }),
        ],
      ],
    ]),
  };
}

const ListSchema = z.object({ start: z.number().int().default(0), page_length: z.number().int().default(PAGE_LENGTH) });
const NameSchema = z.object({ name: z.string() });
const DataSchema = z.object({ data: z.record(z.string(), z.json()) });
const UpdateSchema = NameSchema.extend({ data: z.record(z.string(), z.json()) });
const GenericSchema = z.object({ provider_instance_id: z.string(), doctype: z.string(), name: z.string() });

/** The typed routes of `docType` and its documents in `store`. */
function typedRoutes(store: ErpStore, type: DocType): RequestHandler[] {
  const route = (operation: Operation): string => `*/v1/federated/${type.namespace}/${type.slug}/${operation}`;
  const documents = (): ErpDocument[] => documentsOf(store, type.slug);
  const setDocuments = (rows: ErpDocument[]): void => {
    store.documents.set(type.slug, rows);
  };
  const named = (name: string): ErpDocument | undefined => documents().find((row) => row.name === name);
  let created = 0;
  return [
    http.post(route('list'), async ({ request }) => {
      const { start, page_length: length } = ListSchema.parse(await request.json());
      return HttpResponse.json({ items: documents().slice(start, start + length), start, page_length: length });
    }),
    http.post(route('get'), async ({ request }) => {
      const found = named(NameSchema.parse(await request.json()).name);
      return found === undefined ? notFound() : HttpResponse.json(found);
    }),
    http.post(route('create'), async ({ request }) => {
      created += 1;
      const document = saved(`NEW-${String(created)}`, DataSchema.parse(await request.json()).data);
      setDocuments([document, ...documents()]);
      return HttpResponse.json(document);
    }),
    http.post(route('update'), async ({ request }) => {
      const { name, data } = UpdateSchema.parse(await request.clone().json());
      const current = named(name);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const updated = resaved(current, data);
      setDocuments(documents().map((row) => (row.name === name ? updated : row)));
      return HttpResponse.json(updated);
    }),
    http.post(route('delete'), async ({ request }) => {
      const { name } = NameSchema.parse(await request.clone().json());
      const current = named(name);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      setDocuments(documents().filter((row) => row.name !== name));
      return HttpResponse.json({ key: name, deleted: true });
    }),
  ];
}

/** The generic API's submit or cancel: a draft becomes submitted, a submitted document cancelled. */
function statusRoute(store: ErpStore, action: 'submit' | 'cancel', from: number, to: number): RequestHandler {
  return http.post(`*${DOCUMENT_ENDPOINT}/${action}`, async ({ request }) => {
    const { doctype, name } = GenericSchema.parse(await request.clone().json());
    const type = store.docTypes.find((each) => each.name === doctype);
    if (type === undefined) {
      return notFound();
    }
    const current = documentsOf(store, type.slug).find((row) => row.name === name);
    if (current === undefined) {
      return notFound();
    }
    const refused = refuseStale(request, current);
    if (refused !== null) {
      return refused;
    }
    if (current.docstatus !== from) {
      return HttpResponse.json({ detail: WRONG_STATUS[action] }, { status: HTTP_UNPROCESSABLE });
    }
    const changed = resaved(current, { docstatus: to });
    store.documents.set(
      type.slug,
      documentsOf(store, type.slug).map((row) => (row.name === name ? changed : row)),
    );
    return HttpResponse.json({
      provider_instance_id: type.source_reference,
      doctype,
      name,
      docstatus: to,
      updated_at: changed.updated_at ?? null,
      data: changed,
    });
  });
}

/** The ERP routes over `store`. */
export function erpHandlers(store: ErpStore = erpFixture()): RequestHandler[] {
  return [
    http.get(`*${CATALOGUE_ENDPOINT}`, () => HttpResponse.json({ types: store.docTypes })),
    statusRoute(store, 'submit', DRAFT, SUBMITTED),
    statusRoute(store, 'cancel', SUBMITTED, CANCELLED),
    ...store.docTypes.flatMap((type) => typedRoutes(store, type)),
  ];
}
