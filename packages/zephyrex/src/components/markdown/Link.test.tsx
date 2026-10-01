// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MarkdownLink from './Link';

describe('MarkdownLink', () => {
  it('opens an external link in a new tab without handing it the opener', () => {
    render(<MarkdownLink href='https://example.org/docs'>Docs</MarkdownLink>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps an in-page anchor in the page', () => {
    render(<MarkdownLink href='#usage'>Usage</MarkdownLink>);
    const link = screen.getByRole('link', { name: 'Usage' });
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('embeds a YouTube link as a player', () => {
    render(<MarkdownLink href='https://www.youtube.com/watch?v=dQw4w9WgXcQ'>Video</MarkdownLink>);
    expect(screen.getByTitle('dQw4w9WgXcQ')).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('leaves a YouTube-looking link whose id is the wrong length as a link', () => {
    render(<MarkdownLink href='https://www.youtube.com/watch?v=short'>Not a video</MarkdownLink>);
    expect(screen.getByRole('link', { name: 'Not a video' })).toBeInTheDocument();
  });
});
