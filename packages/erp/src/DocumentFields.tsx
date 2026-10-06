// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId } from 'react';
import { Textarea } from 'zephyrex/ui/textarea';
import { type FieldSpec, type FormValues, newRow, rowKey } from './schemaFields';

const JSON_ROWS = 3;

/** The text of `name` in `values`: an input's value, empty for a table or a field not there. */
const textOf = (values: Readonly<FormValues>, name: string): string => {
  const value = values[name];
  return typeof value === 'string' ? value : '';
};

/** One input of a field: text, a number, or JSON. */
function ValueInput({
  field,
  value,
  onChange,
  label,
}: {
  field: FieldSpec;
  value: string;
  onChange: (value: string) => void;
  label: string;
}): ReactElement {
  const id = useId();
  const input =
    field.kind === 'json' ? (
      <Textarea
        id={id}
        rows={JSON_ROWS}
        className='font-mono'
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    ) : (
      <Input
        id={id}
        type={field.kind === 'text' ? 'text' : 'number'}
        {...(field.kind === 'number' ? { step: 'any' } : {})}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>{label}</Label>
      {input}
      {field.description !== null && <p className='text-xs text-muted-foreground'>{field.description}</p>}
    </div>
  );
}

/** A child table: its rows, each with its columns' inputs, adding and removing rows. */
function ChildTable({
  field,
  rows,
  onChange,
}: {
  field: FieldSpec;
  rows: readonly FormValues[];
  onChange: (rows: FormValues[]) => void;
}): ReactElement {
  const scalarColumns = field.columns.filter(({ kind }) => kind !== 'table');
  return (
    <fieldset className='grid gap-2 rounded-md border p-3'>
      <legend className='px-1 text-sm font-medium'>{field.label}</legend>
      {rows.length === 0 && <p className='text-sm text-muted-foreground'>No rows.</p>}
      {rows.map((row, index) => (
        <fieldset
          key={rowKey(row)}
          aria-label={`${field.label} row ${String(index + 1)}`}
          className='grid gap-2 border-b pb-2 sm:grid-cols-3'
        >
          {scalarColumns.map((column) => (
            <ValueInput
              key={column.name}
              field={column}
              label={column.label}
              value={textOf(row, column.name)}
              onChange={(value) =>
                onChange(rows.map((other, at) => (at === index ? { ...other, [column.name]: value } : other)))
              }
            />
          ))}
          <div className='flex items-end'>
            <Button type='button' size='sm' variant='ghost' onClick={() => onChange(rows.filter((_, at) => at !== index))}>
              Remove row {index + 1}
            </Button>
          </div>
        </fieldset>
      ))}
      <div>
        <Button type='button' size='sm' variant='outline' onClick={() => onChange([...rows, newRow(field.columns)])}>
          Add a row
        </Button>
      </div>
    </fieldset>
  );
}

/** A document's fields as inputs, by its DocType's write schema; child tables as editable rows. */
export function DocumentFields({
  fields,
  values,
  onChange,
}: {
  fields: readonly FieldSpec[];
  values: Readonly<FormValues>;
  onChange: (values: FormValues) => void;
}): ReactElement {
  return (
    <div className='grid gap-3'>
      {fields.map((field) => {
        const value = values[field.name];
        return field.kind === 'table' ? (
          <ChildTable
            key={field.name}
            field={field}
            rows={Array.isArray(value) ? value : []}
            onChange={(rows) => onChange({ ...values, [field.name]: rows })}
          />
        ) : (
          <ValueInput
            key={field.name}
            field={field}
            label={field.label}
            value={textOf(values, field.name)}
            onChange={(text) => onChange({ ...values, [field.name]: text })}
          />
        );
      })}
    </div>
  );
}
