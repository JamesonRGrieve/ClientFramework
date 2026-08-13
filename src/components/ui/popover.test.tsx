// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

describe('Popover', () => {
  it('renders without crashing', () => {
    const { container } = render(<Popover>content</Popover>);
    expect(container).toBeInTheDocument();
  });
});
