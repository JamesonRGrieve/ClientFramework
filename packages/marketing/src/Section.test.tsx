// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from './Section';

describe('Section', () => {
  it('is a region named by its heading, with eyebrow and intro', () => {
    render(
      <Section id='features' title='Features' eyebrow='What you get' intro='All of it.' level={2}>
        <p>Body</p>
      </Section>,
    );
    expect(screen.getByRole('region', { name: 'Features' })).toHaveTextContent('Body');
    expect(screen.getByRole('heading', { level: 2, name: 'Features' })).toBeInTheDocument();
    expect(screen.getByText('What you get')).toBeInTheDocument();
    expect(screen.getByText('All of it.')).toBeInTheDocument();
  });
});
