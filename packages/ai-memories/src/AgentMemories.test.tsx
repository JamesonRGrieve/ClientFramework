// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentMemories, memoryDetails } from './AgentMemories';
import { AGENT_ID, emptyMemoryStore, memoriesFixture, memoryOf } from './memories.mocks';
import { renderMemories } from './testing.mocks';

const MEMORIES = 'Memories';

/** The first of `items`; a test that finds none is wrong. */
function first<T>(items: readonly T[]): T {
  const found = items.at(0);
  if (found === undefined) {
    throw new Error('Expected at least one');
  }
  return found;
}

describe('memoryDetails', () => {
  it('says where a memory came from, when, and how it is recalled', () => {
    const store = memoriesFixture();
    expect(memoryDetails(memoryOf(store, 'm-coffee'))).toMatch(/^from agent · .+ · embedded by text-embedding-3-small$/);
    expect(memoryDetails(memoryOf(store, 'm-deadline'))).toMatch(/recalled by its words$/);
  });
});

describe('AgentMemories', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the agent’s memories newest first, with their labels', async () => {
    const view = renderMemories(<AgentMemories agentId={AGENT_ID} />);
    const list = await view.findByRole('list', { name: MEMORIES });
    const items = within(list)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain('The engine report is due on Friday.');
    expect(items[1]).toContain('coffeeThe user takes their coffee black.');
  });

  it('keeps a memory with a label', async () => {
    const store = memoriesFixture();
    const user = userEvent.setup();
    const view = renderMemories(<AgentMemories agentId={AGENT_ID} />, store);
    await user.type(view.getByLabelText('Label (optional)'), 'tea');
    await user.type(view.getByLabelText('Remember'), 'Prefers tea in the evening.');
    await user.click(view.getByRole('button', { name: 'Keep it' }));
    expect(await view.findByText('Prefers tea in the evening.')).toBeInTheDocument();
    expect(store.memories.at(-1)).toMatchObject({ key: 'tea', source: 'user', agent_id: AGENT_ID });
  });

  it('recalls the memories related to a question, and says when none are', async () => {
    const user = userEvent.setup();
    const view = renderMemories(<AgentMemories agentId={AGENT_ID} />);
    await user.type(view.getByLabelText('Recall'), 'how do they like coffee');
    await user.click(view.getByRole('button', { name: 'Recall' }));
    expect(await view.findByRole('list', { name: 'Recalled' })).toHaveTextContent(
      'coffee: The user takes their coffee black.',
    );
    await user.clear(view.getByLabelText('Recall'));
    await user.type(view.getByLabelText('Recall'), 'zebras');
    await user.click(view.getByRole('button', { name: 'Recall' }));
    expect(await view.findByText('Nothing related.')).toBeInTheDocument();
  });

  it('deletes a memory', async () => {
    const store = memoriesFixture();
    const user = userEvent.setup();
    const view = renderMemories(<AgentMemories agentId={AGENT_ID} />, store);
    const list = await view.findByRole('list', { name: MEMORIES });
    await user.click(first(within(list).getAllByRole('button', { name: 'Delete' })));
    await vi.waitFor(() => {
      expect(store.memories.some(({ id }) => id === 'm-deadline')).toBe(false);
    });
  });

  it('asks for something to remember, and says when there is nothing yet', async () => {
    const user = userEvent.setup();
    const view = renderMemories(<AgentMemories agentId={AGENT_ID} />, emptyMemoryStore());
    expect(await view.findByText('Nothing remembered yet.')).toBeInTheDocument();
    await user.click(view.getByRole('button', { name: 'Keep it' }));
    expect(await view.findByRole('alert')).toHaveTextContent('Write what to remember.');
  });
});
