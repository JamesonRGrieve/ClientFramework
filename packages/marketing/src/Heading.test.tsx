// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Heading, subLevel } from './Heading';

describe('Heading', () => {
  it('renders the level the caller chooses', () => {
    render(<Heading level={3}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 3, name: 'Title' })).toBeInTheDocument();
  });

  it('steps one level down, never past h4', () => {
    expect([subLevel(1), subLevel(2), subLevel(3), subLevel(4)]).toEqual([2, 3, 4, 4]);
  });
});
