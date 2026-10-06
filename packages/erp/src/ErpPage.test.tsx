// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CUSTOMER_TYPE, erpFixture, INVOICE_TYPE } from './erp.mocks';
import { byInstance, ErpPage } from './ErpPage';
import { renderErp } from './testing.mocks';

const ACME = 'ERPNext acme-production';

describe('byInstance', () => {
  it('groups DocTypes under the instance they belong to, in order', () => {
    const other = { ...CUSTOMER_TYPE, source_reference: 'other', source: 'ERPNext staging' };
    expect(
      byInstance([CUSTOMER_TYPE, other, INVOICE_TYPE]).map(({ title, docTypes }) => [
        title,
        docTypes.map(({ name }) => name),
      ]),
    ).toEqual([
      [ACME, ['Customer', 'Sales Invoice']],
      ['ERPNext staging', ['Customer']],
    ]);
  });
});

describe('ErpPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the ERPNext DocTypes under their instance, each linking to its page', async () => {
    const view = renderErp(<ErpPage />);
    const instance = await view.findByRole('region', { name: ACME });
    expect(
      within(instance)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Customer', '/erp/erpnext_3f2a9c1d/customer'],
      ['Sales Invoice', '/erp/erpnext_3f2a9c1d/sales_invoice'],
    ]);
    expect(view.queryByText('Post')).not.toBeInTheDocument();
  });

  it('finds a DocType by name, and says when none matches', async () => {
    const user = userEvent.setup();
    const view = renderErp(<ErpPage />);
    await view.findByRole('region', { name: ACME });
    await user.type(view.getByLabelText('Find a document type'), 'invoice');
    expect(view.queryByRole('link', { name: 'Customer' })).not.toBeInTheDocument();
    await user.type(view.getByLabelText('Find a document type'), 'zzz');
    expect(await view.findByText('No document type matches.')).toBeInTheDocument();
  });

  it('says when no ERPNext site is connected', async () => {
    const view = renderErp(<ErpPage />, { ...erpFixture(), docTypes: [] });
    expect(await view.findByText('No ERPNext site is connected for you.')).toBeInTheDocument();
  });
});
