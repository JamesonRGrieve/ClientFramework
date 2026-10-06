// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { nth } from 'zephyrex/testing';
import { CUSTOMER_TYPE, INVOICE_TYPE } from './erp.mocks';
import { fieldsOf, formProblem, formValuesOf, type JsonSchema, labelOf, newRow, rowKey, writePayload } from './schemaFields';
import { rowsOf } from './testing.mocks';

const schemaOf = (schema: JsonSchema | null): JsonSchema => schema ?? {};

describe('fieldsOf', () => {
  it('reads each field’s kind and label, nullable unions and $refs resolved, a table with its columns', () => {
    expect(fieldsOf(schemaOf(INVOICE_TYPE.write_schema))).toEqual([
      { name: 'customer', label: 'Customer', kind: 'text', description: null, columns: [] },
      { name: 'due_date', label: 'Due Date', kind: 'text', description: null, columns: [] },
      {
        name: 'items',
        label: 'Items',
        kind: 'table',
        description: null,
        columns: [
          { name: 'item_code', label: 'Item Code', kind: 'text', description: null, columns: [] },
          { name: 'qty', label: 'Qty', kind: 'integer', description: null, columns: [] },
          { name: 'rate', label: 'Rate', kind: 'number', description: null, columns: [] },
        ],
      },
    ]);
  });

  it('labels an untitled field by its name, and treats a field of any type as JSON', () => {
    expect(fieldsOf({ properties: { delivery_note: { type: 'string' }, extra: {} } })).toEqual([
      { name: 'delivery_note', label: 'Delivery note', kind: 'text', description: null, columns: [] },
      { name: 'extra', label: 'Extra', kind: 'json', description: null, columns: [] },
    ]);
    expect(labelOf('due_date')).toBe('Due date');
  });
});

describe('form values', () => {
  const fields = fieldsOf(schemaOf(INVOICE_TYPE.write_schema));
  const invoice = {
    customer: 'Acme Ltd',
    due_date: null,
    items: [{ name: 'row-1', item_code: 'WIDGET', qty: 2, rate: 10.5 }],
  };

  it('shows a document’s values as text, a table’s rows keyed and named', () => {
    const values = formValuesOf(fields, invoice);
    expect(values['customer']).toBe('Acme Ltd');
    expect(values['due_date']).toBe('');
    const row = nth(rowsOf(values, 'items'), 0);
    expect(row).toMatchObject({ item_code: 'WIDGET', qty: '2', rate: '10.5', name: 'row-1' });
    expect(rowKey(row)).toMatch(/^row-\d+$/);
  });

  it('sends only what changed: numbers as numbers, blanks as null, a changed table whole with its rows named', () => {
    const before = formValuesOf(fields, invoice);
    expect(writePayload(fields, before, before)).toEqual({});
    const added = { ...newRow(nth(fields, 2).columns), item_code: 'BOLT', qty: '5' };
    const changed = { ...before, due_date: '2026-11-01', customer: '', items: [...rowsOf(before, 'items'), added] };
    expect(writePayload(fields, changed, before)).toEqual({
      due_date: '2026-11-01',
      customer: null,
      items: [
        { item_code: 'WIDGET', qty: 2, rate: 10.5, name: 'row-1' },
        { item_code: 'BOLT', qty: 5 },
      ],
    });
  });

  it('sends every filled field of a new document', () => {
    const customerFields = fieldsOf(schemaOf(CUSTOMER_TYPE.write_schema));
    const empty = formValuesOf(customerFields, {});
    expect(writePayload(customerFields, { ...empty, customer_name: 'Initech', credit_limit: '250.5' }, empty)).toEqual({
      customer_name: 'Initech',
      credit_limit: 250.5,
    });
  });

  it('says which value is not of its field’s kind, child rows included', () => {
    const json = { name: 'meta', label: 'Meta', kind: 'json' as const, description: null, columns: [] };
    expect(formProblem([json], { meta: '{"a": 1}' })).toBeNull();
    expect(formProblem([json], { meta: '{a' })).toBe('Meta is JSON.');
    expect(formProblem(fieldsOf(schemaOf(CUSTOMER_TYPE.write_schema)), { credit_limit: 'lots' })).toBe(
      'Credit Limit is a number.',
    );
    const values = formValuesOf(fields, invoice);
    const badRow = { ...nth(rowsOf(values, 'items'), 0), qty: '1.5' };
    expect(formProblem(fields, { ...values, items: [badRow] })).toBe('Qty is a whole number.');
  });
});
