// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { ApiError, type GuardedSave, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';
import { JsonSchemaSchema, type JsonValue } from './schemaFields';

export const CATALOGUE_ENDPOINT = '/v1/federated/catalogue';
export const DOCUMENT_ENDPOINT = '/v1/erp/document';
/** A list page's size, as the server takes it (1 to 500). */
export const PAGE_LENGTH = 20;

const HTTP_NOT_FOUND = 404;
const OPERATIONS = ['list', 'get', 'create', 'update', 'delete'] as const;
export type Operation = (typeof OPERATIONS)[number];

/**
 * One typed model the user may use, from the catalogue: a DocType of one ERPNext instance (named by
 * `source_reference`), the routes of its operations, and its record and write JSON Schemas.
 */
export const DocTypeSchema = z.object({
  namespace: z.string(),
  source: z.string(),
  source_reference: z.string(),
  name: z.string(),
  slug: z.string(),
  key_field: z.string(),
  version_field: z.string(),
  operations: z.array(z.enum(OPERATIONS)),
  rest: z.partialRecord(z.enum(OPERATIONS), z.string()),
  record_schema: JsonSchemaSchema,
  write_schema: JsonSchemaSchema.nullable(),
});
export type DocType = z.infer<typeof DocTypeSchema>;

const CatalogueSchema = z.object({ types: z.array(DocTypeSchema) });

/** A document as the typed model answers it: its fields, and the site's own (`name`, `docstatus`, `updated_at`, …). */
export const DocumentSchema = z
  .object({
    name: z.string(),
    docstatus: z.number().int().optional(),
    /** The document's version (the site's `modified`): its ETag. */
    updated_at: z.string().nullable().optional(),
    /** Never set by the site (it has `creation`); declared so a document is a versioned row. */
    created_at: z.string().nullable().optional(),
  })
  .catchall(z.json());
export type ErpDocument = z.infer<typeof DocumentSchema>;

const PageSchema = z.object({ items: z.array(DocumentSchema), start: z.number().int(), page_length: z.number().int() });
/** A page of a list: its documents, from `start`, at most `page_length` of them. */
export type DocumentBatch = z.infer<typeof PageSchema>;

/** Whether a catalogue type is an ERPNext DocType rather than another federated source's. */
const isErpType = ({ namespace }: DocType): boolean => namespace.startsWith('erpnext_');

/** The ERPNext DocTypes the user may use, by instance then name. */
export function useDocTypes(): SWRResponse<DocType[], Error> {
  const client = useClient();
  return useSWR<DocType[], Error>(client.url(CATALOGUE_ENDPOINT), async () =>
    CatalogueSchema.parse(await client.get(CATALOGUE_ENDPOINT))
      .types.filter(isErpType)
      .sort((a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name)),
  );
}

/** The route of `operation` on `docType`; a DocType that doesn't serve it (a Single's list) is a mistake to ask. */
function routeOf(docType: DocType, operation: Operation): string {
  const route = docType.rest[operation];
  if (route === undefined) {
    throw new Error(`${docType.name} has no ${operation}`);
  }
  return route;
}

/** A page of `docType`'s documents from `start`, newest first. */
export function useDocuments(docType: DocType, start: number): SWRResponse<DocumentBatch, Error> {
  const client = useClient();
  const route = routeOf(docType, 'list');
  return useSWR<DocumentBatch, Error>([client.url(route), start], async () =>
    PageSchema.parse(await client.post(route, { start, page_length: PAGE_LENGTH, order_by: 'modified desc' })),
  );
}

/** One document with its child tables, or null when there is no such document. */
export function useDocument(docType: DocType, name: string): SWRResponse<ErpDocument | null, Error> {
  const client = useClient();
  const route = routeOf(docType, 'get');
  return useSWR<ErpDocument | null, Error>([client.url(route), name], async () => {
    try {
      return DocumentSchema.parse(await client.post(route, { name }));
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

/** Creates a document from its fields; resolves to it as saved. */
export async function createDocument(
  client: ZephyrexClient,
  docType: DocType,
  data: Record<string, JsonValue>,
): Promise<ErpDocument> {
  return DocumentSchema.parse(await client.post(routeOf(docType, 'create'), { data }));
}

export interface DocumentActions {
  /** `save.save(document, changes)`: the fields changed, guarded by the document as loaded. */
  save: GuardedSave<ErpDocument>;
  /** `remove.save(document, {})`: delete it, guarded by it as loaded. */
  remove: GuardedSave<ErpDocument>;
  /** `submit.save(document, {})`: submit a draft (a submittable DocType's), guarded by it as loaded. */
  submit: GuardedSave<ErpDocument>;
  /** `cancel.save(document, {})`: cancel a submitted document, guarded by it as loaded. */
  cancel: GuardedSave<ErpDocument>;
}

/** The writes to `docType`'s document `name`, each refreshing it as shown. */
export function useDocumentActions(docType: DocType, name: string): DocumentActions {
  const client = useClient();
  const { mutate: refresh } = useDocument(docType, name);
  const generic = useCallback(
    (action: 'submit' | 'cancel') =>
      async (seen: ErpDocument): Promise<void> => {
        await client.postGuarded(
          `${DOCUMENT_ENDPOINT}/${action}`,
          { provider_instance_id: docType.source_reference, doctype: docType.name, name: seen.name },
          seen,
        );
        await refresh();
      },
    [client, docType, refresh],
  );
  const save = useCallback(
    async (seen: ErpDocument, changes: Partial<ErpDocument>): Promise<void> => {
      await client.postGuarded(routeOf(docType, 'update'), { name: seen.name, data: changes }, seen);
      await refresh();
    },
    [client, docType, refresh],
  );
  const remove = useCallback(
    async (seen: ErpDocument): Promise<void> => {
      await client.postGuarded(routeOf(docType, 'delete'), { name: seen.name }, seen);
    },
    [client, docType],
  );
  return {
    save: useGuardedSave(save, DocumentSchema),
    remove: useGuardedSave(remove, DocumentSchema),
    submit: useGuardedSave(generic('submit'), DocumentSchema),
    cancel: useGuardedSave(generic('cancel'), DocumentSchema),
  };
}
