// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemePicker, themeLabel } from './ThemePicker';

const DARK = 'Dark';

describe('ThemePicker', () => {
  beforeEach(() => {
    document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.documentElement.className = '';
  });

  it('offers the four themes by name, each with a preview in its own colours', () => {
    render(<ThemePicker initialTheme='light' />);
    const group = screen.getByRole('group', { name: 'Theme' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual([
      'Light',
      DARK,
      'Colour-blind',
      'Colour-blind dark',
    ]);
    // Each preview carries its theme's class, so its tokens are that theme's.
    expect(group.querySelector('[data-preview="dark"]')).toHaveClass('dark');
    expect(group.querySelector('[data-preview="light"]')).toHaveClass('light');
  });

  it('marks the current theme and switches to the one chosen', async () => {
    const user = userEvent.setup();
    render(<ThemePicker initialTheme='light' />);
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: DARK }));
    expect(screen.getByRole('radio', { name: DARK })).toBeChecked();
    expect(document.documentElement).toHaveClass('dark');
    expect(document.cookie).toContain('theme=dark');
  });

  it('marks the server-read choice in the server render, so hydration keeps it', () => {
    const page = new DOMParser().parseFromString(renderToString(<ThemePicker initialTheme='dark' />), 'text/html');
    const checked = [...page.querySelectorAll('input[type="radio"][checked]')].map((radio) => radio.getAttribute('value'));
    expect(checked).toEqual(['dark']);
  });

  it('names a theme as a person reads it', () => {
    expect(themeLabel('colorblind-dark')).toBe('Colour-blind dark');
    expect(themeLabel('high_contrast')).toBe('High contrast');
  });
});
