// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './sheet';

describe('Sheet', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Sheet>
        content
      </Sheet>
    );
    expect(container).toBeInTheDocument();
  });
});
