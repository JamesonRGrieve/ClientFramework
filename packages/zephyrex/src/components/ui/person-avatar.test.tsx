// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { initialsOf, PersonAvatar } from './person-avatar';
import { personTone } from './person-tone';

describe('initialsOf', () => {
  it('takes the first and last word’s initials, at most two', () => {
    expect(initialsOf('Ada King Lovelace')).toBe('AL');
    expect(initialsOf('you')).toBe('Y');
    expect(initialsOf('  ')).toBe('');
  });
});

describe('PersonAvatar', () => {
  it('shows the initials in the person’s own colour, hidden from screen readers', () => {
    const { container } = render(<PersonAvatar id='u-ada' name='Ada Lovelace' />);
    const badge = container.firstElementChild;
    expect(badge).toHaveTextContent('AL');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveClass(`bg-person-${String(personTone('u-ada'))}`, 'text-person-foreground');
  });

  it('takes the view’s colour and given initials when passed', () => {
    const { container } = render(<PersonAvatar id='u-ada' name='You' tone={5} initials='Me' size='md' />);
    const badge = container.firstElementChild;
    expect(badge).toHaveTextContent('Me');
    expect(badge).toHaveClass('bg-person-5', 'size-8');
  });
});
