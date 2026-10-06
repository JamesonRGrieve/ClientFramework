// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { DocumentFields } from './DocumentFields';
import { INVOICE_TYPE } from './erp.mocks';
import { fieldsOf, type FormValues, formValuesOf } from './schemaFields';
import { rowsOf } from './testing.mocks';

const FIELDS = fieldsOf(INVOICE_TYPE.write_schema ?? {});
const INVOICE = { customer: 'Acme Ltd', items: [{ name: 'row-1', item_code: 'WIDGET', qty: 2, rate: 10.5 }] };

/** The fields over their own values, reporting each change. */
function Editable({ onChange }: { onChange: (values: FormValues) => void }): ReactElement {
  const [values, setValues] = useState(() => formValuesOf(FIELDS, INVOICE));
  return (
    <DocumentFields
      fields={FIELDS}
      values={values}
      onChange={(changed) => {
        setValues(changed);
        onChange(changed);
      }}
    />
  );
}

describe('DocumentFields', () => {
  it('edits a field, numbers as number inputs', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = render(<Editable onChange={onChange} />);
    await user.type(view.getByLabelText('Due Date'), '2026-12-01');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ due_date: '2026-12-01' }));
    expect(within(view.getByRole('group', { name: 'Items row 1' })).getByLabelText('Qty')).toHaveAttribute('type', 'number');
  });

  it('adds, edits and removes a child row', async () => {
    const onChange = vi.fn<(values: FormValues) => void>();
    const lastItemCodes = (): (FormValues[string] | undefined)[] =>
      rowsOf(nth(onChange.mock.calls, -1)[0], 'items').map(({ item_code: code }) => code);
    const user = userEvent.setup();
    const view = render(<Editable onChange={onChange} />);
    await user.click(view.getByRole('button', { name: 'Add a row' }));
    await user.type(within(view.getByRole('group', { name: 'Items row 2' })).getByLabelText('Item Code'), 'BOLT');
    expect(lastItemCodes()).toEqual(['WIDGET', 'BOLT']);
    await user.click(view.getByRole('button', { name: 'Remove row 1' }));
    expect(lastItemCodes()).toEqual(['BOLT']);
  });

  it('says when a table has no rows', () => {
    const view = render(<DocumentFields fields={FIELDS} values={formValuesOf(FIELDS, {})} onChange={vi.fn()} />);
    expect(view.getByText('No rows.')).toBeInTheDocument();
  });
});
