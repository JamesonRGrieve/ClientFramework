// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { useAgentContextPromptActions, useAgentContextPrompts } from './agentsApi';
import { PromptLinks } from './PromptLinks';
import { renderAgents } from './testing.mocks';

const LINK = 'Link';
const PICKER = 'Add a prompt';

/** The links as an agent page shows them, linking through `link`. */
function AgentLinks({ link }: { link: (promptId: string) => Promise<void> }): ReactElement {
  const { data: links = [] } = useAgentContextPrompts(AGENT_ID);
  const { remove } = useAgentContextPromptActions(AGENT_ID);
  return <PromptLinks links={links} link={link} unlink={remove} />;
}

describe('PromptLinks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names each linked prompt, and offers only the prompts not linked', async () => {
    const store = agentsFixture();
    store.agentPrompts.push({ ...rowOf(store.agentPrompts, 'acp-1'), id: 'acp-gone', prompt_id: 'gone' });
    const view = renderAgents(<AgentLinks link={vi.fn()} />, store);
    expect(await view.findByRole('list', { name: 'Context prompts' })).toHaveTextContent(
      'House styleUnlinkA prompt you can no longer seeUnlink',
    );
    expect(await view.findByRole('option', { name: 'Brief' })).toBeInTheDocument();
    expect(view.queryByRole('option', { name: 'House style' })).not.toBeInTheDocument();
  });

  it('unlinks a prompt', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<AgentLinks link={vi.fn()} />, store);
    await view.findByRole('list', { name: 'Context prompts' });
    await user.click(view.getByRole('button', { name: 'Unlink' }));
    expect(await view.findByText('No context prompts.')).toBeInTheDocument();
    expect(store.agentPrompts).toEqual([]);
  });

  it('links the prompt chosen, asking for one first', async () => {
    const link = vi.fn(async () => Promise.resolve());
    const user = userEvent.setup();
    const view = renderAgents(<AgentLinks link={link} />, { ...agentsFixture(), agentPrompts: [] });
    expect(await view.findByText('No context prompts.')).toBeInTheDocument();
    await user.click(view.getByRole('button', { name: LINK }));
    expect(await view.findByRole('alert')).toHaveTextContent('Choose a prompt.');
    await user.selectOptions(view.getByLabelText(PICKER), await view.findByRole('option', { name: 'Brief' }));
    await user.click(view.getByRole('button', { name: LINK }));
    await vi.waitFor(() => {
      expect(view.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(link).toHaveBeenCalledWith('brief');
    expect(view.getByLabelText(PICKER)).toHaveValue('');
  });

  it('says so when a link fails', async () => {
    const link = vi.fn(async () => Promise.reject(new Error('No such prompt')));
    const user = userEvent.setup();
    const view = renderAgents(<AgentLinks link={link} />);
    await user.selectOptions(view.getByLabelText(PICKER), await view.findByRole('option', { name: 'Brief' }));
    await user.click(view.getByRole('button', { name: LINK }));
    expect(await view.findByRole('alert')).toHaveTextContent('No such prompt');
  });
});
