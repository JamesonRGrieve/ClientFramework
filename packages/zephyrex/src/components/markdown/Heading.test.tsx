// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MarkdownHeading, * as mod from './Heading';

describe('Heading', () => {
  it('module exports', () => {
    expect(mod).toBeDefined();
  });

  it('starts a section with more room above it than below, and none when it opens the block', () => {
    render(<MarkdownHeading tag='h2'>Your rights</MarkdownHeading>);
    // my-1 left a heading sitting on the list before it (Zephyreader's and Remembron's reviews).
    expect(screen.getByRole('heading', { level: 2, name: 'Your rights' })).toHaveClass('mt-8', 'mb-3', 'first:mt-0');
  });
});
