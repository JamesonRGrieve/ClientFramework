// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './command';

describe('Command', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Command>
        content
      </Command>
    );
    expect(container).toBeInTheDocument();
  });
});
