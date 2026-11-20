// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * One declaration per resource of how each API field is stored: its column, and how it is
 * written and read (JSON text for lists and objects, as SQLite has no arrays). A lite app's
 * resource specs build their Prisma writes and their answers from it (`fields` is
 * `(row) => fieldsOf(COLUMNS, row)`), so a field is named once instead of in every insert, update
 * and serialiser. Lifted from zephyrex-rpg-ai, which zephyrex-rpg-wiki had copied (Framework
 * Candidates, 2026-11-20).
 */

/**
 * A field's value as the API carries it or Prisma stores it. Each resource's own zod schema checks
 * it at the boundary; the mapping here only moves it between field and column.
 */
export type FieldValue = unknown;

export interface Column {
  /** The Prisma field. */
  column: string;
  write: (value: FieldValue) => FieldValue;
  read: (stored: FieldValue) => FieldValue;
}

/** A field stored as itself (text, numbers, booleans, nullable values). */
export function plain(column: string): Column {
  return { column, write: (value) => value, read: (stored) => stored };
}

function parseJson(stored: FieldValue, fallback: FieldValue): FieldValue {
  if (typeof stored !== 'string') {
    return fallback;
  }
  try {
    const parsed: FieldValue = JSON.parse(stored);
    return parsed;
  } catch {
    return fallback;
  }
}

/** A list stored as JSON text; unreadable text reads as an empty list. */
export function jsonList(column: string): Column {
  return {
    column,
    write: (value) => JSON.stringify(value),
    read: (stored): FieldValue[] => {
      const value = parseJson(stored, []);
      return Array.isArray(value) ? (value as FieldValue[]) : [];
    },
  };
}

/** An object stored as JSON text; unreadable text reads as an empty object. */
export function jsonObject(column: string): Column {
  return {
    column,
    write: (value) => JSON.stringify(value),
    read: (stored): object => {
      const value = parseJson(stored, {});
      return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
    },
  };
}

export type Columns = Readonly<Record<string, Column>>;

/** The Prisma data for the fields `input` names (an absent field is left as it is). */
export function columnsOf(columns: Columns, input: object): Record<string, FieldValue> {
  const data: Record<string, FieldValue> = {};
  for (const [field, column] of Object.entries(columns)) {
    const value: FieldValue = Reflect.get(input, field);
    if (value !== undefined) {
      data[column.column] = column.write(value);
    }
  }
  return data;
}

/** A row's API fields, read back through their columns. */
export function fieldsOf(columns: Columns, row: object): Record<string, FieldValue> {
  const fields: Record<string, FieldValue> = {};
  for (const [field, column] of Object.entries(columns)) {
    fields[field] = column.read(Reflect.get(row, column.column));
  }
  return fields;
}
