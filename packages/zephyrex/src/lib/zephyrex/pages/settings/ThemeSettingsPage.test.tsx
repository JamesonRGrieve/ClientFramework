// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeSettings, ThemeSettingsPage } from './ThemeSettingsPage';
import { TestWrapper } from '@/testing/TestWrapper';

const jar = vi.hoisted(() => ({ theme: undefined as string | undefined }));
vi.mock('next/headers.js', () => ({
  cookies: async () =>
    Promise.resolve({
      get: (name: string) => (name === 'theme' && jar.theme !== undefined ? { value: jar.theme } : undefined),
    }),
}));

// The picker writes the theme cookie it shows into document.cookie; start each render without one.
const clearThemeCookie = (): void => {
  document.cookie = 'theme=; max-age=0; path=/';
};
beforeEach(clearThemeCookie);

describe('ThemeSettings', () => {
  it('heads the page Appearance and offers the four themes, the given one checked', () => {
    render(<ThemeSettings theme='colorblind' />, { wrapper: TestWrapper });
    expect(screen.getByRole('heading', { level: 1, name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Theme' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: 'Colour-blind' })).toBeChecked();
  });

  it('renders the app’s own settings below the theme', () => {
    render(
      <ThemeSettings theme='dark'>
        <p>Reading speed</p>
      </ThemeSettings>,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText('Reading speed')).toBeInTheDocument();
  });
});

describe('ThemeSettingsPage', () => {
  it('marks the theme from the cookie, or the app’s default when there is none', async () => {
    jar.theme = 'dark';
    const { unmount } = render(await ThemeSettingsPage({}), { wrapper: TestWrapper });
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    unmount();
    clearThemeCookie();
    jar.theme = undefined;
    render(await ThemeSettingsPage({ defaultTheme: 'colorblind-dark' }), { wrapper: TestWrapper });
    expect(screen.getByRole('radio', { name: 'Colour-blind dark' })).toBeChecked();
  });
});
