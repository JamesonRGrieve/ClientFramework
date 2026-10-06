// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { DocTypePage } from './DocTypePage';
import { documentsOf, erpFixture, NAMESPACE } from './erp.mocks';
import { DocumentSchema, PAGE_LENGTH } from './erpApi';
import { renderErp } from './testing.mocks';

const INVOICES = { namespace: NAMESPACE, slug: 'sales_invoice' };
const CUSTOMERS = { namespace: NAMESPACE, slug: 'customer' };
const CREATE = 'Create Customer';

describe('DocTypePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the documents, each with its status, linking to its page', async () => {
    const view = renderErp(<DocTypePage params={INVOICES} />);
    expect(await view.findByRole('heading', { name: 'Sales Invoice', level: 1 })).toBeInTheDocument();
    const items = within(await view.findByRole('list', { name: 'Sales Invoice documents' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringMatching(/^ACC-SINV-0001Draft · /),
      expect.stringMatching(/^ACC-SINV-0002Submitted · /),
    ]);
    expect(within(nth(items, 0)).getByRole('link')).toHaveAttribute(
      'href',
      '/erp/erpnext_3f2a9c1d/sales_invoice/ACC-SINV-0001',
    );
  });

  it('pages through more documents than fit on one page', async () => {
    const store = erpFixture();
    const many = Array.from({ length: PAGE_LENGTH + 1 }, (_, index) =>
      DocumentSchema.parse({ name: `C-${String(index)}`, docstatus: 0 }),
    );
    store.documents.set(CUSTOMERS.slug, many);
    const user = userEvent.setup();
    const view = renderErp(<DocTypePage params={CUSTOMERS} />, store);
    await view.findByRole('link', { name: 'C-0' });
    expect(view.getByRole('button', { name: 'Newer' })).toBeDisabled();
    await user.click(view.getByRole('button', { name: 'Older' }));
    expect(await view.findByRole('link', { name: `C-${String(PAGE_LENGTH)}` })).toBeInTheDocument();
    expect(view.getByRole('button', { name: 'Older' })).toBeDisabled();
  });

  it('makes a new document from its fields and opens it', async () => {
    const store = erpFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderErp(<DocTypePage params={CUSTOMERS} />, store);
    await user.click(await view.findByRole('button', { name: 'Make a new Customer' }));
    const form = within(view.getByRole('form', { name: 'New Customer' }));
    await user.type(form.getByLabelText('Customer Name'), 'Initech');
    await user.type(form.getByLabelText('Credit Limit'), '250');
    await user.click(form.getByRole('button', { name: CREATE }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/erp/erpnext_3f2a9c1d/customer/NEW-1');
    });
    expect(nth(documentsOf(store, CUSTOMERS.slug), 0)).toMatchObject({ customer_name: 'Initech', credit_limit: 250 });
  });

  it('says when the DocType is not one the user can use', async () => {
    const view = renderErp(<DocTypePage params={{ namespace: NAMESPACE, slug: 'gone' }} />);
    expect(await view.findByText(/This document type is not one you can use\./)).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Back to the document types' })).toHaveAttribute('href', '/erp');
  });
});
