// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Latex } from './Latex';

describe('Latex', () => {
  it('typesets display and inline math between delimiters, leaving the prose as text', () => {
    const { container } = render(<Latex>{'Area is $\\pi r^2$, and $$E = mc^2$$'}</Latex>);
    expect(container.querySelectorAll('.katex')).toHaveLength(2);
    expect(container.querySelectorAll('.katex-display')).toHaveLength(1);
    expect(container.textContent).toContain('Area is');
  });

  it('shows markup in the source as text, never as HTML', () => {
    const { container } = render(<Latex>{'<img src=x onerror="alert(1)"> $x$'}</Latex>);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x');
  });

  it('shows bad LaTeX as an error in place and keeps typesetting the rest', () => {
    const { container } = render(<Latex>{'$\\notacommand$ and $y$'}</Latex>);
    // KaTeX prints an unknown command in place, in its error colour, instead of throwing.
    expect(container.querySelectorAll('.katex')).toHaveLength(2);
    expect(container.textContent).toContain('\\notacommand');
  });
});
