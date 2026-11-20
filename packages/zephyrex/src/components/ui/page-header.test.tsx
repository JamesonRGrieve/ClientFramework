// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('titles the page, says what it is for, and holds its actions', () => {
    const view = render(
      <PageHeader
        title='People'
        description='Everyone you have recorded.'
        meta='7 people'
        actions={<button type='button'>Add person</button>}
      />,
    );
    expect(view.getByRole('heading', { level: 1, name: 'People' })).toBeInTheDocument();
    expect(view.getByText('Everyone you have recorded.')).toBeInTheDocument();
    expect(view.getByText('7 people')).toBeInTheDocument();
    expect(view.getByRole('button', { name: 'Add person' })).toBeInTheDocument();
  });

  it('is only a title when given only a title', () => {
    const view = render(<PageHeader title='People' />);
    expect(view.container.querySelectorAll('p')).toHaveLength(0);
    expect(view.queryByRole('button')).toBeNull();
  });
});
