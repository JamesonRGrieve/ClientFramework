// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dialog } from './dialog';

describe('Dialog', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dialog>content</Dialog>);
    expect(container).toBeInTheDocument();
  });
});
