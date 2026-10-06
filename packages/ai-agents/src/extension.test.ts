// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { aiAgentsExtension as registered } from 'zephyrex/extensions';
import { AgentPage } from './AgentPage';
import { AgentsPage } from './AgentsPage';
import { aiAgentsExtension } from './extension';
import { ProjectPage } from './ProjectPage';
import { ProjectsPage } from './ProjectsPage';

describe('aiAgentsExtension', () => {
  it('is the registered AI agents extension, with the agent and project pages and menu entries', () => {
    expect(aiAgentsExtension).toMatchObject({ name: 'ai_agents', serverExtension: 'ai_agents' });
    expect(aiAgentsExtension.displayName).toBe(registered.displayName);
    expect(aiAgentsExtension.pages).toEqual([
      { path: '/agents', component: AgentsPage },
      { path: '/agents/:agentId', component: AgentPage },
      { path: '/projects', component: ProjectsPage },
      { path: '/projects/:projectId', component: ProjectPage },
    ]);
    expect(aiAgentsExtension.navItems).toEqual([
      { title: 'Agents', url: '/agents' },
      { title: 'Projects', url: '/projects' },
    ]);
  });
});
