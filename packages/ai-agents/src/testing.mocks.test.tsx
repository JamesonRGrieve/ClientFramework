// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { agentsFixture } from './agents.mocks';
import { useAgents } from './agentsApi';
import { loaded, recordCalls, renderAgents } from './testing.mocks';

const BASE = 'http://localhost:1996';

function AgentCount(): string {
  return `${String(useAgents().data?.length ?? 0)} agents`;
}

describe('the test helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('render under the Zephyrex test app, answering the agent routes from the fixture', async () => {
    expect(await renderAgents(<AgentCount />).findByText('2 agents')).toBeInTheDocument();
  });

  it('render from the store given', async () => {
    expect(
      await renderAgents(<AgentCount />, { ...agentsFixture(), agents: [] }).findByText('0 agents'),
    ).toBeInTheDocument();
  });

  it('read what a hook loads, once it has loaded', async () => {
    recordCalls(agentsFixture());
    await expect(loaded(() => useAgents())).resolves.toHaveLength(2);
    await expect(loaded(() => ({ data: undefined }))).rejects.toThrow();
  });

  it('record each call answered from the store', async () => {
    const calls = recordCalls(agentsFixture());
    await expect((await fetch(`${BASE}/v1/agent/helper`)).json()).resolves.toMatchObject({ agent: { name: 'Helper' } });
    expect(calls.map(({ url }) => url)).toEqual([`${BASE}/v1/agent/helper`]);
  });
});
