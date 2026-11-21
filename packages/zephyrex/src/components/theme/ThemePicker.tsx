'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactElement, useId } from 'react';
import { useTheme } from './useTheme';
import { cn } from '@/lib/utils';

/** The framework's own themes by their names; an app's own theme is title-cased from its name. */
const LABELS: Readonly<Record<string, string>> = {
  light: 'Light',
  dark: 'Dark',
  colorblind: 'Colour-blind',
  'colorblind-dark': 'Colour-blind dark',
};

/** A theme's name as a person reads it. */
export function themeLabel(theme: string): string {
  return (
    LABELS[theme] ??
    theme
      .split(/[-_\s]+/)
      .filter((word) => word !== '')
      .map((word, at) => (at === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ')
  );
}

/**
 * The themes as a group of native radios, each a small preview drawn in its own theme's colours (its
 * tokens, scoped by the theme's class, so the theme ratchet sees no colour); arrow keys move between
 * them as in any radio group. The choice is kept in the framework's `theme` cookie. Pass
 * `initialTheme` from the server's read of that cookie (`(await cookies()).get('theme')?.value`), so
 * the server render marks the person's choice and hydration keeps it (Zephyrex RPG's finding);
 * without it the device's setting is the fallback.
 */
export function ThemePicker({
  initialTheme,
  customThemes,
  label = 'Theme',
}: {
  initialTheme?: string;
  customThemes?: string[];
  /** Names the group (its legend, read by screen readers; a visible heading above can say it too). */
  label?: string;
}): ReactElement {
  const { themes, currentTheme, setTheme } = useTheme(customThemes, initialTheme);
  const name = useId();
  return (
    <fieldset className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
      <legend className='sr-only'>{label}</legend>
      {themes.map((theme) => (
        <label
          key={theme}
          className='grid cursor-pointer gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted has-checked:border-primary has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-2 has-focus-visible:ring-ring'
        >
          <input
            type='radio'
            name={name}
            value={theme}
            checked={theme === currentTheme}
            onChange={() => setTheme(theme)}
            className='sr-only'
          />
          {/* The preview: the theme's page, two lines of its text and its primary colour. */}
          <span
            aria-hidden
            data-preview={theme}
            className={cn(
              theme === 'light' ? 'light' : theme,
              'flex h-14 items-end justify-between gap-2 rounded-md border bg-background p-2',
            )}
          >
            <span className='grid gap-1'>
              <span className='h-1.5 w-10 rounded-full bg-foreground' />
              <span className='h-1.5 w-14 rounded-full bg-muted-foreground' />
            </span>
            <span className='size-4 shrink-0 rounded-full bg-primary' />
          </span>
          <span className='font-medium'>{themeLabel(theme)}</span>
        </label>
      ))}
    </fieldset>
  );
}
