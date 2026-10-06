// SPDX-License-Identifier: AGPL-3.0-or-later
// A DocType's form from its JSON Schema (the typed model's, as the catalogue publishes it): the
// fields a document holds, each a kind of input, and child tables as lists of rows; the form's
// values back into the write payload the server takes.
import { z } from 'zod';

/** A JSON Schema as Pydantic writes one: types, nullable unions, child models under $defs. */
export interface JsonSchema {
  type?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  properties?: Record<string, JsonSchema> | undefined;
  items?: JsonSchema | undefined;
  anyOf?: JsonSchema[] | undefined;
  $ref?: string | undefined;
  $defs?: Record<string, JsonSchema> | undefined;
}

export const JsonSchemaSchema: z.ZodType<JsonSchema> = z.lazy(() =>
  z.object({
    type: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    properties: z.record(z.string(), JsonSchemaSchema).optional(),
    items: JsonSchemaSchema.optional(),
    anyOf: z.array(JsonSchemaSchema).optional(),
    $ref: z.string().optional(),
    $defs: z.record(z.string(), JsonSchemaSchema).optional(),
  }),
);

/** How a field is edited: text, a whole number, a number, any JSON, or a table of child rows. */
type FieldKind = 'text' | 'integer' | 'number' | 'json' | 'table';

export interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  description: string | null;
  /** A table's columns: its child DocType's fields. */
  columns: FieldSpec[];
}

const REF_PREFIX = '#/$defs/';
const JSON_TYPES = new Set(['object', undefined]);

/** A fieldname as a label, when the schema gives no title: `customer_name` → `Customer name`. */
export const labelOf = (name: string): string => {
  const words = name.replaceAll('_', ' ').trim();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

/** `schema` with a $ref followed and a nullable union narrowed to what is not null. */
function resolved(schema: JsonSchema, defs: Readonly<Record<string, JsonSchema>>): JsonSchema {
  if (schema.$ref?.startsWith(REF_PREFIX) === true) {
    return resolved(defs[schema.$ref.slice(REF_PREFIX.length)] ?? {}, defs);
  }
  const notNull = (schema.anyOf ?? []).filter(({ type }) => type !== 'null');
  const only = notNull.length === 1 ? notNull.at(0) : undefined;
  return only === undefined ? schema : resolved({ ...only, title: schema.title, description: schema.description }, defs);
}

function kindOf(schema: JsonSchema): FieldKind {
  if (schema.type === 'array' && schema.items !== undefined) {
    return 'table';
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    return schema.type;
  }
  return schema.type === 'string' ? 'text' : JSON_TYPES.has(schema.type) ? 'json' : 'text';
}

function fieldsIn(schema: JsonSchema, defs: Readonly<Record<string, JsonSchema>>): FieldSpec[] {
  return Object.entries(resolved(schema, defs).properties ?? {}).map(([name, property]) => {
    const field = resolved(property, defs);
    const kind = kindOf(field);
    return {
      name,
      label: field.title ?? labelOf(name),
      kind,
      description: field.description ?? null,
      columns: kind === 'table' && field.items !== undefined ? fieldsIn(field.items, defs) : [],
    };
  });
}

/** The fields of a DocType's write schema, in the schema's order. */
export const fieldsOf = (schema: JsonSchema): FieldSpec[] => fieldsIn(schema, schema.$defs ?? {});

const JsonValueSchema = z.json();
export type JsonValue = z.infer<typeof JsonValueSchema>;
/** A form's values: text for every input, and rows of values for a table. */
export type FormValue = string | FormValues[];
export interface FormValues {
  [name: string]: FormValue;
}

/** A child row's own name, kept so the server saves onto the row rather than adding one. */
const ROW_NAME: FieldSpec = { name: 'name', label: 'Name', kind: 'text', description: null, columns: [] };

/** Where a form row keeps its key for the page (never sent: the payload holds only the schema's fields). */
const ROW_KEY = '__row';
let rowsMade = 0;

/** A row's key for the page: the one it was given. */
export const rowKey = (row: Readonly<FormValues>): string => {
  const key = row[ROW_KEY];
  return typeof key === 'string' ? key : '';
};

/** `values` as a form row, with a key of its own. */
const keyed = (values: FormValues): FormValues => {
  rowsMade += 1;
  return { ...values, [ROW_KEY]: `row-${String(rowsMade)}` };
};

/** A new, empty row of a table with `columns`. */
export const newRow = (columns: readonly FieldSpec[]): FormValues =>
  keyed(Object.fromEntries(columns.map(({ name, kind }): [string, FormValue] => [name, kind === 'table' ? [] : ''])));

const isRecord = (value: JsonValue): value is Record<string, JsonValue> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A value as its input shows it: JSON (and anything not a plain value) as JSON text. */
const shownValue = (field: FieldSpec, value: JsonValue): string =>
  field.kind === 'json' || typeof value === 'object' ? JSON.stringify(value) : String(value);

/** A document's (or a child row's) values as the form shows them: numbers and JSON as text, tables as rows. */
export function formValuesOf(fields: readonly FieldSpec[], record: Readonly<Record<string, JsonValue>>): FormValues {
  return Object.fromEntries(
    fields.map((field): [string, FormValue] => {
      const value = record[field.name] ?? null;
      if (field.kind === 'table') {
        const rows = Array.isArray(value) ? value : [];
        return [field.name, rows.map((row) => keyed(formValuesOf([...field.columns, ROW_NAME], isRecord(row) ? row : {})))];
      }
      return [field.name, value === null ? '' : shownValue(field, value)];
    }),
  );
}

/** A value as compared for a change: a table's rows without the keys the page gave them. */
function comparable(value: FormValue): string {
  return typeof value === 'string'
    ? value
    : JSON.stringify(
        value.map((row) =>
          Object.entries(row).flatMap(([key, inner]) => (key === ROW_KEY ? [] : [[key, comparable(inner)]])),
        ),
      );
}

/** Why a value can't be sent as its field's kind, or null. */
function valueProblem(field: FieldSpec, text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  if (field.kind === 'integer' && !Number.isInteger(Number(trimmed))) {
    return `${field.label} is a whole number.`;
  }
  if (field.kind === 'number' && Number.isNaN(Number(trimmed))) {
    return `${field.label} is a number.`;
  }
  if (field.kind === 'json' && !JsonValueSchema.safeParse(safeJson(trimmed)).success) {
    return `${field.label} is JSON.`;
  }
  return null;
}

const NOT_JSON = Symbol('not JSON');
function safeJson(text: string): JsonValue | typeof NOT_JSON {
  try {
    return JsonValueSchema.parse(JSON.parse(text));
  } catch {
    return NOT_JSON;
  }
}

/** The first problem in `values` for `fields` (child rows included), or null. */
export function formProblem(fields: readonly FieldSpec[], values: Readonly<FormValues>): string | null {
  for (const field of fields) {
    const value = values[field.name] ?? '';
    const problem =
      typeof value === 'string'
        ? valueProblem(field, value)
        : (value.map((row) => formProblem(field.columns, row)).find((wrong) => wrong !== null) ?? null);
    if (problem !== null) {
      return problem;
    }
  }
  return null;
}

/** A field's text as the value sent: blank is null, numbers and JSON parsed. */
function sentValue(field: FieldSpec, text: string): JsonValue {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  if (field.kind === 'integer' || field.kind === 'number') {
    return Number(trimmed);
  }
  if (field.kind === 'json') {
    const parsed = safeJson(trimmed);
    return parsed === NOT_JSON ? null : parsed;
  }
  return text;
}

/**
 * The write payload for `values`: only the fields that differ from `before` (a new document's
 * `before` is empty), each child table whole, its existing rows named. Check `formProblem` first.
 */
export function writePayload(
  fields: readonly FieldSpec[],
  values: Readonly<FormValues>,
  before: Readonly<FormValues>,
): Record<string, JsonValue> {
  const payload: Record<string, JsonValue> = {};
  for (const field of fields) {
    const value = values[field.name] ?? '';
    if (comparable(value) === comparable(before[field.name] ?? (field.kind === 'table' ? [] : ''))) {
      continue;
    }
    payload[field.name] =
      typeof value === 'string'
        ? sentValue(field, value)
        : value.map((row) => {
            const sent = writePayload(field.columns, row, {});
            const rowName = row['name'];
            return typeof rowName === 'string' && rowName !== '' ? { ...sent, name: rowName } : sent;
          });
  }
  return payload;
}
