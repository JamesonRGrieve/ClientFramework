// SPDX-License-Identifier: AGPL-3.0-or-later
import { type ConflictField, serverInstant, type Versioned } from 'zephyrex';
import type { z } from 'zod';
import { type Draft, type FieldSpec, sameInstant } from './fields';

/** A row of the health log: an id and its version. */
export type HealthRow = { readonly id: string } & Versioned;

/**
 * One kind of record in the user's health log: where it lives on the server, its form's fields,
 * and how its rows become a form's text and back.
 */
export interface RecordType<T extends HealthRow> {
  /** The record's place in the app's routes (/health/<name>). */
  readonly name: string;
  readonly title: string;
  readonly plural: string;
  readonly endpoint: string;
  /** The single row's envelope key. */
  readonly single: string;
  /** The list's envelope key. */
  readonly envelope: string;
  readonly schema: z.ZodType<T>;
  readonly fields: readonly FieldSpec<T>[];
  /** When the record happened, as the server wrote it. */
  readonly timeOf: (row: T) => string;
  /** The record in a few words, for a list. */
  readonly describe: (row: T) => string;
  /** A form's text: a row's values, or a new record's starting values. */
  readonly draftOf: (row: T | null) => Draft;
  /** A form's text as the record's values. */
  readonly valuesOf: (draft: Draft) => Partial<T>;
  /** Why the values can't be saved together (wake before bed, say), or null. */
  readonly problemOf?: (draft: Draft) => string | null;
}

/**
 * What a save sends: every value for a new record, else only the fields that changed from `base`
 * (a timestamp counts as changed only when it names another instant).
 */
export function changesFrom<T extends HealthRow>(type: RecordType<T>, base: T | null, draft: Draft): Partial<T> {
  const next = type.valuesOf(draft);
  if (base === null) {
    return next;
  }
  const changes: Partial<T> = {};
  for (const { key, input } of type.fields) {
    const value = next[key];
    const saved = base[key];
    const same =
      input === 'datetime' && typeof value === 'string' && typeof saved === 'string'
        ? sameInstant(value, saved)
        : value === (saved ?? null);
    if (!same) {
      changes[key] = value;
    }
  }
  return changes;
}

/** The fields a conflict compares, timestamps shown in the user's own time. */
export function conflictFields<T extends HealthRow>(type: RecordType<T>): ConflictField<T>[] {
  return type.fields.map(({ key, label, input }) =>
    input === 'datetime'
      ? {
          key,
          label,
          format: (row: Partial<T>): string => {
            const value = row[key];
            return typeof value === 'string' ? serverInstant(value).toLocaleString() : '';
          },
        }
      : { key, label },
  );
}

/** Newest first, by when each record happened. */
export const newestFirst =
  <T extends HealthRow>(type: RecordType<T>) =>
  (a: T, b: T): number =>
    serverInstant(type.timeOf(b)).getTime() - serverInstant(type.timeOf(a)).getTime();
