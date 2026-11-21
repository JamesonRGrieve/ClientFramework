// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MarkdownImage from './Image';

describe('MarkdownImage', () => {
  it('shows a remote image as it is, with no Referer, so a hotlink-blocking host still serves it', () => {
    render(<MarkdownImage src='https://static.wikia.nocookie.net/x/images/a.png' alt='A map' />);
    const image = screen.getByRole('img', { name: 'A map' });
    expect(image).toHaveAttribute('src', 'https://static.wikia.nocookie.net/x/images/a.png');
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('shows nothing without a source', () => {
    const { container } = render(<MarkdownImage alt='Nothing' />);
    expect(container).toBeEmptyDOMElement();
  });
});
