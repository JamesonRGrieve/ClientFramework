// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

describe('Collapsible', () => {
  it('renders without crashing', () => {
    const { container } = render(<Collapsible>content</Collapsible>);
    expect(container).toBeInTheDocument();
  });
});
