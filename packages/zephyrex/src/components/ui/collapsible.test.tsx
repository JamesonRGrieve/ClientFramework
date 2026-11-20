// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

describe('Collapsible', () => {
  it('renders without crashing', () => {
    const { container } = render(<Collapsible>content</Collapsible>);
    expect(container).toBeInTheDocument();
  });

  it('animates its content in as it opens, unless motion is reduced', async () => {
    const view = render(
      <Collapsible>
        <CollapsibleTrigger>More</CollapsibleTrigger>
        <CollapsibleContent>The rest</CollapsibleContent>
      </Collapsible>,
    );
    await userEvent.setup().click(view.getByRole('button', { name: 'More' }));
    const content = view.getByText('The rest');
    expect(content).toHaveAttribute('data-state', 'open');
    expect(content).toHaveClass('data-[state=open]:animate-in', 'motion-reduce:animate-none');
  });
});
