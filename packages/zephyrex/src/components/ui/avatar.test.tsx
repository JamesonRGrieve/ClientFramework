// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

/** jsdom never loads an image; this one reports itself loaded, so Radix shows the <img>. */
class LoadedImage extends EventTarget {
  complete = true;
  naturalWidth = 1;
  referrerPolicy = '';
  crossOrigin: string | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.dispatchEvent(new Event('load')));
  }
}

describe('Avatar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows its fallback until a picture loads', () => {
    render(
      <Avatar>
        <AvatarFallback>JR</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('JR')).toBeInTheDocument();
  });

  it('asks for its picture with no Referer by default, so a hotlink-blocking host serves it', async () => {
    vi.stubGlobal('Image', LoadedImage);
    render(
      <Avatar>
        <AvatarImage src='https://static.wikia.nocookie.net/x/a.png' alt='Elric' />
      </Avatar>,
    );
    expect(await screen.findByRole('img', { name: 'Elric' })).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('keeps a referrer policy the caller sets', async () => {
    vi.stubGlobal('Image', LoadedImage);
    render(
      <Avatar>
        <AvatarImage src='/me.png' alt='Me' referrerPolicy='same-origin' />
      </Avatar>,
    );
    expect(await screen.findByRole('img', { name: 'Me' })).toHaveAttribute('referrerpolicy', 'same-origin');
  });
});
