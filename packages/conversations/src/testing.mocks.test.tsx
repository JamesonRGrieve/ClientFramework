// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUser } from 'zephyrex';
import { useConversations } from './conversationsApi';
import { renderConversations } from './testing.mocks';

function Summary(): string {
  const { data: user } = useUser();
  return `${user?.id ?? 'nobody'}: ${String(useConversations().data?.length ?? 0)} conversations`;
}

describe('renderConversations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signed in, answering the conversation routes from the given store', async () => {
    const view = renderConversations(<Summary />);
    expect(await view.findByText('u-me: 2 conversations')).toBeInTheDocument();
  });

  it('serves no conversations from an empty store', async () => {
    const view = renderConversations(<Summary />, { conversations: [], participants: [], messages: [] });
    expect(await view.findByText('u-me: 0 conversations')).toBeInTheDocument();
  });
});
