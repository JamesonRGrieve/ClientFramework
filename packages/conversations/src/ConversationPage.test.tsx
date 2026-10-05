// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConversationPage } from './ConversationPage';
import { renderConversations } from './testing.mocks';

describe('ConversationPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a group chat the user owns: its messages, its people and its details', async () => {
    const view = renderConversations(<ConversationPage params={{ conversationId: 'plans' }} />);
    expect(await view.findByRole('heading', { level: 1, name: 'Engine plans' })).toBeInTheDocument();
    expect(await view.findByRole('list', { name: 'Messages' })).toBeInTheDocument();
    expect(await view.findByRole('list', { name: 'Participants' })).toBeInTheDocument();
    expect(await view.findByRole('form', { name: 'Chat details' })).toBeInTheDocument();
    expect(await view.findByRole('button', { name: 'Delete conversation' })).toBeInTheDocument();
  });

  it('titles a direct conversation by the other person, with no details to change', async () => {
    const view = renderConversations(<ConversationPage params={{ conversationId: 'dm-charles' }} />);
    expect(await view.findByRole('heading', { level: 1, name: 'Babbage' })).toBeInTheDocument();
    expect(view.queryByText('Details')).toBeNull();
  });

  it('says a conversation the user isn’t in does not exist for them', async () => {
    const view = renderConversations(<ConversationPage params={{ conversationId: 'elsewhere' }} />);
    expect(await view.findByText(/does not exist or you are not in it/)).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Back to your conversations' })).toHaveAttribute('href', '/conversations');
  });
});
