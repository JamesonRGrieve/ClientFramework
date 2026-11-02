// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGifts } from './giftsApi';
import { renderGifts } from './testing.mocks';

function GiftCount(): string {
  return `${String(useGifts().data?.length ?? -1)} gifts`;
}

describe('renderGifts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signed in, answering the gifts routes', async () => {
    const view = renderGifts(<GiftCount />);
    expect(await view.findByText('2 gifts')).toBeInTheDocument();
  });
});
