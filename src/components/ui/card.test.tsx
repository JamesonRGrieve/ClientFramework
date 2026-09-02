// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';

describe('Card', () => {
  it('renders without crashing', () => {
    const { container } = render(<Card>content</Card>);
    expect(container).toBeInTheDocument();
  });
});
