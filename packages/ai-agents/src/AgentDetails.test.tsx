// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { AgentDetails, agentChanges } from './AgentDetails';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { renderAgents } from './testing.mocks';

const SAVE = 'Save agent';

describe('agentChanges', () => {
  const scribe = rowOf(agentsFixture().agents, AGENT_ID);
  const draft = { name: 'Scribe', favourite: true, rotationId: 'fast', imageUrl: '' };

  it('keeps only what changed, trimmed, a blank image being none', () => {
    expect(agentChanges(scribe, { ...draft, name: ' Scribe ', imageUrl: ' ' })).toEqual({});
    expect(agentChanges(scribe, { ...draft, favourite: false, rotationId: null, imageUrl: ' /scribe.png ' })).toEqual({
      favourite: false,
      rotation_id: null,
      image_url: '/scribe.png',
    });
  });
});

describe('AgentDetails', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves a change to the agent', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<AgentDetails agent={rowOf(store.agents, AGENT_ID)} />, store);
    await user.click(view.getByLabelText('Favourite'));
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(rowOf(store.agents, AGENT_ID).favourite).toBe(false);
  });

  it('keeps the user’s change beside the agent as it is now when it changed first', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<AgentDetails agent={rowOf(store.agents, AGENT_ID)} />, store);
    store.agents = store.agents.map((row) =>
      row.id === AGENT_ID ? { ...row, name: 'Renamed first', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    const name = view.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Mine');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('radio', { name: 'Current: Renamed first' })).not.toBeChecked();
  });

  it('says when there is nothing to save, and wants a name', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<AgentDetails agent={rowOf(store.agents, AGENT_ID)} />, store);
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Nothing to save.');
    await user.clear(view.getByLabelText('Name'));
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('alert')).toHaveTextContent('An agent needs a name.');
  });

  it('deletes the agent and goes back to the agents', async () => {
    const store = agentsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderAgents(<AgentDetails agent={rowOf(store.agents, AGENT_ID)} />, store);
    await user.click(view.getByRole('button', { name: 'Delete agent' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/agents');
    });
    expect(store.agents.some(({ id }) => id === AGENT_ID)).toBe(false);
  });
});
