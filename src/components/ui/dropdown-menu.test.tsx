// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './dropdown-menu';

describe('DropdownMenu', () => {
  it('renders without crashing', () => {
    const { container } = render(<DropdownMenu>content</DropdownMenu>);
    expect(container).toBeInTheDocument();
  });
});
