// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import CodeBlock from './CodeBlock';

describe('CodeBlock', () => {
  it('names its icon-only controls', () => {
    render(
      <CodeBlock language='python' fileName='hello'>
        print(1)
      </CodeBlock>,
    );
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download hello.py' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse code' })).toBeInTheDocument();
  });

  it('shows plain code without a tablist when nothing renders it', () => {
    render(<CodeBlock language='python'>print(1)</CodeBlock>);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  it('switches between the rendered view and the source as tabs, by click and arrow key', async () => {
    const user = userEvent.setup();
    render(<CodeBlock language='csv'>{'name,age\nAda,36'}</CodeBlock>);
    const tabs = within(screen.getByRole('tablist', { name: 'View' })).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Rendered', 'Source']);
    const rendered = screen.getByRole('tab', { name: 'Rendered' });
    const source = screen.getByRole('tab', { name: 'Source' });
    expect(screen.getByRole('tab', { selected: true })).toBe(rendered);
    expect(screen.getByRole('tabpanel', { name: 'Rendered' })).toHaveAttribute('id', rendered.getAttribute('aria-controls'));

    await user.click(source);
    expect(screen.getByRole('tab', { selected: true })).toBe(source);
    expect(screen.getByRole('tabpanel', { name: 'Source' })).toHaveTextContent('Ada,36');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { selected: true })).toBe(rendered);
    expect(rendered).toHaveFocus();
  });

  it('keeps two blocks on a page from sharing ids', () => {
    render(
      <>
        <CodeBlock language='csv'>{'a\n1'}</CodeBlock>
        <CodeBlock language='csv'>{'b\n2'}</CodeBlock>
      </>,
    );
    const ids = screen.getAllByRole('tab').map((tab) => tab.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
