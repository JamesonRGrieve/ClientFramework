// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';

describe('Select', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Select>
        content
      </Select>
    );
    expect(container).toBeInTheDocument();
  });
});
