// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecordsHeader } from './RecordsHeader';

describe('RecordsHeader', () => {
  it('heads a records page under a link back to the stores', () => {
    const view = render(<RecordsHeader title='Orders' />);
    expect(view.getByRole('heading', { level: 1, name: 'Orders' })).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Stores' })).toHaveAttribute('href', '/store');
  });
});
