// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { DocumentPage } from './DocumentPage';
import { documentOf, documentsOf, erpFixture, type ErpStore, INVOICE, NAMESPACE } from './erp.mocks';
import { DocumentSchema, type ErpDocument } from './erpApi';
import { renderErp } from './testing.mocks';

const INVOICES = 'sales_invoice';
const AT = { namespace: NAMESPACE, slug: INVOICES, name: INVOICE };
const invoiceIn = (store: ErpStore): ErpDocument => documentOf(store, INVOICES, INVOICE);

describe('DocumentPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a draft’s fields and item rows for editing', async () => {
    const view = renderErp(<DocumentPage params={AT} />);
    expect(await view.findByLabelText('Customer')).toHaveValue('Acme Ltd');
    expect(view.getByText(/^Draft · /)).toBeInTheDocument();
    const rows = view.getAllByRole('group', { name: /^Items row/ });
    expect(rows).toHaveLength(2);
    expect(within(nth(rows, 1)).getByLabelText('Item Code')).toHaveValue('GADGET');
  });

  it('saves only what changed, an added item row included', async () => {
    const store = erpFixture();
    const user = userEvent.setup();
    const view = renderErp(<DocumentPage params={AT} />, store);
    await user.clear(await view.findByLabelText('Due Date'));
    await user.type(view.getByLabelText('Due Date'), '2026-12-01');
    await user.click(view.getByRole('button', { name: 'Add a row' }));
    const added = nth(view.getAllByRole('group', { name: /^Items row/ }), -1);
    await user.type(within(added).getByLabelText('Item Code'), 'BOLT');
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(invoiceIn(store)).toMatchObject({
      due_date: '2026-12-01',
      items: [{ name: 'row-1' }, { name: 'row-2' }, { item_code: 'BOLT' }],
    });
  });

  it('says when there is nothing to save, and keeps the user’s change beside the document as it is now', async () => {
    const store = erpFixture();
    const user = userEvent.setup();
    const view = renderErp(<DocumentPage params={AT} />, store);
    await user.click(await view.findByRole('button', { name: 'Save' }));
    expect(await view.findByRole('status')).toHaveTextContent('Nothing to save.');
    const changedFirst = DocumentSchema.parse({
      ...invoiceIn(store),
      customer: 'Globex',
      updated_at: '2026-10-02 08:00:00.000001',
    });
    store.documents.set(
      INVOICES,
      documentsOf(store, INVOICES).map((row) => (row.name === INVOICE ? changedFirst : row)),
    );
    await user.type(view.getByLabelText('Customer'), ' Group');
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('radio', { name: 'Current: Globex' })).not.toBeChecked();
  });

  it('submits a draft, then cancels it', async () => {
    const store = erpFixture();
    const user = userEvent.setup();
    const view = renderErp(<DocumentPage params={AT} />, store);
    await user.click(await view.findByRole('button', { name: 'Submit' }));
    expect(await view.findByRole('status')).toHaveTextContent('Submitted.');
    expect(await view.findByText(/^Submitted · /)).toBeInTheDocument();
    expect(view.getByLabelText('Customer')).toBeDisabled();
    await user.click(view.getByRole('button', { name: 'Cancel it' }));
    expect(await view.findByText(/^Cancelled · /)).toBeInTheDocument();
    expect(invoiceIn(store).docstatus).toBe(2);
  });

  it('deletes the document and goes back to its DocType', async () => {
    const store = erpFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderErp(<DocumentPage params={AT} />, store);
    await user.click(await view.findByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/erp/erpnext_3f2a9c1d/sales_invoice');
    });
    expect(documentsOf(store, INVOICES).map(({ name }) => name)).toEqual(['ACC-SINV-0002']);
  });

  it('says when there is no such document', async () => {
    const view = renderErp(<DocumentPage params={{ ...AT, name: 'gone' }} />);
    expect(await view.findByText(/There is no such document\./)).toBeInTheDocument();
  });
});
