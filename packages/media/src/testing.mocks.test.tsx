// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyMediaStore } from './media.mocks';
import { useWatchLists } from './mediaApi';
import { renderMedia } from './testing.mocks';

function ListCount(): string {
  return `${String(useWatchLists().data?.length ?? -1)} lists`;
}

describe('renderMedia', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signed in, answering /v1/watch-lists from the fixture', async () => {
    const view = renderMedia(<ListCount />);
    expect(await view.findByText('1 lists')).toBeInTheDocument();
  });

  it('answers from the store it is given', async () => {
    const view = renderMedia(<ListCount />, emptyMediaStore());
    expect(await view.findByText('0 lists')).toBeInTheDocument();
  });
});
