// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocTypeGate } from './DocTypeGate';
import { NAMESPACE } from './erp.mocks';
import { renderErp } from './testing.mocks';

describe('DocTypeGate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page for the DocType a namespace and slug name, under its heading and instance', async () => {
    const view = renderErp(
      <DocTypeGate params={{ namespace: NAMESPACE, slug: 'customer' }}>{(docType) => `${docType.slug} page`}</DocTypeGate>,
    );
    expect(await view.findByText('customer page')).toBeInTheDocument();
    expect(view.getByRole('heading', { name: 'Customer', level: 1 })).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'ERPNext acme-production' })).toHaveAttribute('href', '/erp');
  });

  it('says when no DocType has that namespace and slug', async () => {
    const view = renderErp(
      <DocTypeGate params={{ namespace: 'wordpress_blog', slug: 'post' }}>{() => 'never'}</DocTypeGate>,
    );
    expect(await view.findByText(/This document type is not one you can use\./)).toBeInTheDocument();
    expect(view.queryByText('never')).not.toBeInTheDocument();
  });
});
