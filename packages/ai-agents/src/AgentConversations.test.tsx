// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { AgentConversations, conversationName } from './AgentConversations';
import { AGENT_ID, agentsFixture } from './agents.mocks';
import { renderAgents } from './testing.mocks';

const JOIN = 'Join';
const PICKER = 'Join a conversation';

describe('conversationName', () => {
  it('names a group chat by its name, and one without', () => {
    expect(conversationName({ name: 'Plans', is_group_chat: true })).toBe('Plans');
    expect(conversationName({ name: '', is_group_chat: true })).toBe('Untitled chat');
    expect(conversationName({ name: null, is_group_chat: false })).toBe('Direct conversation');
    expect(conversationName(undefined)).toBe('A conversation you can no longer see');
  });
});

describe('AgentConversations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the conversations it is in, and offers only the others', async () => {
    const view = renderAgents(<AgentConversations agentId={AGENT_ID} />);
    expect(await view.findByRole('list', { name: 'Its conversations' })).toHaveTextContent('Engine plans');
    expect(await view.findByRole('option', { name: 'Notes' })).toBeInTheDocument();
    expect(view.queryByRole('option', { name: 'Engine plans' })).not.toBeInTheDocument();
    expect(view.getByLabelText('Takes part')).toBeChecked();
    expect(view.getByLabelText('Answers every message')).not.toBeChecked();
  });

  it('makes it answer every message, and leaves', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<AgentConversations agentId={AGENT_ID} />, store);
    await user.click(await view.findByLabelText('Answers every message'));
    await vi.waitFor(() => {
      expect(rowOf(store.seats, 'seat-1').auto_respond).toBe(true);
    });
    await user.click(view.getByRole('button', { name: 'Leave' }));
    expect(await view.findByText('It takes part in no conversations.')).toBeInTheDocument();
  });

  it('joins the conversation chosen, asking for one first', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<AgentConversations agentId={AGENT_ID} />, store);
    await user.click(view.getByRole('button', { name: JOIN }));
    expect(await view.findByRole('alert')).toHaveTextContent('Choose a conversation.');
    await user.selectOptions(view.getByLabelText(PICKER), await view.findByRole('option', { name: 'Notes' }));
    await user.click(view.getByLabelText('Answer every message'));
    await user.click(view.getByRole('button', { name: JOIN }));
    await vi.waitFor(() => {
      expect(store.seats.at(-1)).toMatchObject({ conversation_id: 'notes', active: true, auto_respond: true });
    });
    expect(view.getByLabelText(PICKER)).toHaveValue('');
  });
});
