// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AGENT_ID, emptyMemoryStore } from './memories.mocks';
import { useMemories } from './memoriesApi';
import { renderMemories } from './testing.mocks';

function MemoryCount(): string {
  return `${String(useMemories(AGENT_ID).data?.length ?? 0)} memories`;
}

describe('renderMemories', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders under the Zephyrex test app, answering the memory routes from the given store', async () => {
    const view = renderMemories(<MemoryCount />);
    expect(await view.findByText('2 memories')).toBeInTheDocument();
  });

  it('serves no memories from an empty store', async () => {
    const view = renderMemories(<MemoryCount />, emptyMemoryStore());
    expect(await view.findByText('0 memories')).toBeInTheDocument();
  });
});
