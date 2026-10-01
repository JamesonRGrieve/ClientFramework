// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RateLimitBanner } from './RateLimitBanner';

describe('RateLimitBanner', () => {
  it('announces the wait, rounded up to whole seconds', () => {
    const view = render(<RateLimitBanner remainingMs={2100} />);
    expect(view.getByRole('alert')).toHaveTextContent('Too many requests. Retrying in 3s');
  });
});
