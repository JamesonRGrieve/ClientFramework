// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PLAN_FREE, PLAN_PRO } from './marketing.mocks';
import { PricingCard } from './PricingCard';

describe('PricingCard', () => {
  it('shows the price, what is included and where to start', () => {
    render(<PricingCard plan={PLAN_FREE} />);
    const card = screen.getByRole('article', { name: 'Free' });
    expect(card).toHaveTextContent('$0');
    expect(card).toHaveTextContent('Every core feature');
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/start');
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
  });

  it('marks the highlighted plan', () => {
    render(<PricingCard plan={PLAN_PRO} recommendedLabel='Best value' />);
    expect(screen.getByText('Best value')).toBeInTheDocument();
  });
});
