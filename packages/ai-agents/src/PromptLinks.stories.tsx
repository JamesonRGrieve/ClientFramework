// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ReactElement } from 'react';
import { useClient } from 'zephyrex';
import { withZephyrexApi } from 'zephyrex/testing';
import { AGENT_ID, agentHandlers, agentsFixture } from './agents.mocks';
import { linkContextPrompt, useAgentContextPromptActions, useAgentContextPrompts } from './agentsApi';
import { PromptLinks } from './PromptLinks';

/** An agent's context prompts, as its page links them. */
function AgentLinks(): ReactElement {
  const client = useClient();
  const { data: links = [], mutate } = useAgentContextPrompts(AGENT_ID);
  const { remove } = useAgentContextPromptActions(AGENT_ID);
  return (
    <PromptLinks
      links={links}
      unlink={remove}
      link={async (promptId) => {
        await linkContextPrompt(client, AGENT_ID, promptId);
        await mutate();
      }}
    />
  );
}

const meta: Meta<typeof AgentLinks> = {
  title: 'ai-agents/PromptLinks',
  component: AgentLinks,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AgentLinks>;

export const OneLinked: Story = {};

export const NoneLinked: Story = {
  parameters: { msw: { handlers: agentHandlers({ ...agentsFixture(), agentPrompts: [] }) } },
};
