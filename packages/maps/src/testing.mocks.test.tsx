// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlaceCategories } from './mapsApi';
import { renderMaps } from './testing.mocks';

function CategoryCount(): string {
  return `${String(usePlaceCategories().data?.length ?? 0)} kinds`;
}

describe('renderMaps', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signed in, answering /v1/maps', async () => {
    const view = renderMaps(<CategoryCount />);
    expect(await view.findByText('3 kinds')).toBeInTheDocument();
  });
});
