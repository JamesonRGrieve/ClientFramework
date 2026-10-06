// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { ShortTermMemory } from './ShortTermMemory';
import { renderAgents } from './testing.mocks';

const ADD = 'Add';

describe('ShortTermMemory', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('changes a working memory, and forgets one', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<ShortTermMemory agentId={AGENT_ID} />, store);
    const content = await view.findByLabelText('tone');
    await user.clear(content);
    await user.type(content, 'Plain.');
    await user.click(view.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => {
      expect(rowOf(store.workingMemory, 'wm-tone').content).toBe('Plain.');
    });
    await user.click(view.getByRole('button', { name: 'Forget' }));
    expect(await view.findByText('Nothing in working memory.')).toBeInTheDocument();
  });

  it('adds a working memory under a new key', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<ShortTermMemory agentId={AGENT_ID} />, store);
    await user.type(view.getByLabelText('Key'), 'audience');
    await user.type(view.getByLabelText('Content'), 'Engineers.');
    await user.click(view.getByRole('button', { name: ADD }));
    expect(await view.findByLabelText('audience')).toHaveValue('Engineers.');
    expect(view.getByLabelText('Key')).toHaveValue('');
  });

  it('wants a key and content, and a key the agent doesn’t have', async () => {
    const user = userEvent.setup();
    const view = renderAgents(<ShortTermMemory agentId={AGENT_ID} />);
    await view.findByLabelText('tone');
    await user.click(view.getByRole('button', { name: ADD }));
    expect(await view.findByRole('alert')).toHaveTextContent('Give the memory a key and some content.');
    await user.type(view.getByLabelText('Key'), 'tone');
    await user.type(view.getByLabelText('Content'), 'Casual.');
    await user.click(view.getByRole('button', { name: ADD }));
    expect(await view.findByRole('alert')).toHaveTextContent('The agent already remembers tone: change it above.');
  });

  it('keeps the user’s change beside the memory as it is now when it changed first', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<ShortTermMemory agentId={AGENT_ID} />, store);
    const content = await view.findByLabelText('tone');
    store.workingMemory = store.workingMemory.map((row) => ({
      ...row,
      content: 'Changed first.',
      updated_at: '2026-10-02T08:00:00.000001',
    }));
    await user.type(content, ' Mine.');
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('radio', { name: 'Current: Changed first.' })).not.toBeChecked();
  });
});
