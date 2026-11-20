// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureCard } from './FeatureCard';
import { FEATURE_EVERYWHERE, FEATURE_HOSTED } from './marketing.mocks';

describe('FeatureCard', () => {
  it('shows a feature with its points and no badge when it works everywhere', () => {
    render(<FeatureCard feature={FEATURE_EVERYWHERE} />);
    expect(screen.getByRole('article', { name: 'Works offline' })).toHaveTextContent('No account');
    expect(screen.queryByText('Hosted service')).not.toBeInTheDocument();
  });

  it("badges a hosted-only feature, in the app's words when given", () => {
    const { rerender } = render(<FeatureCard feature={FEATURE_HOSTED} level={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Sync across devices' })).toBeInTheDocument();
    expect(screen.getByText('Hosted service')).toBeInTheDocument();
    rerender(<FeatureCard feature={FEATURE_HOSTED} hostedLabel='Cloud' />);
    expect(screen.getByText('Cloud')).toBeInTheDocument();
  });
});
