// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RadioGroup, RadioGroupItem } from './radio-group';

describe('RadioGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(<RadioGroup>content</RadioGroup>);
    expect(container).toBeInTheDocument();
  });
});
