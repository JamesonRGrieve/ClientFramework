// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CtaBand } from './CtaBand';
import { CTA } from './marketing.mocks';

describe('CtaBand', () => {
  it('names its region by its title and links to the action', () => {
    render(<CtaBand title='Ready?' body='It is free.' action={CTA} />);
    expect(screen.getByRole('region', { name: 'Ready?' })).toHaveTextContent('It is free.');
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/start');
  });

  it('puts its heading at the level the page needs', () => {
    render(<CtaBand title='Ready?' body='It is free.' action={CTA} level={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Ready?' })).toBeInTheDocument();
  });
});
