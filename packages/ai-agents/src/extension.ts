// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { aiAgentsExtension as registered } from 'zephyrex/extensions';
import { AgentPage } from './AgentPage';
import { AgentsPage } from './AgentsPage';
import { ProjectPage } from './ProjectPage';
import { ProjectsPage } from './ProjectsPage';
import { AGENTS_PATH, PROJECTS_PATH } from './routes';

/** The AI agents client extension with its pages and menu entries, for an app's `extensions`. */
export const aiAgentsExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: AGENTS_PATH, component: AgentsPage },
    { path: `${AGENTS_PATH}/:agentId`, component: AgentPage },
    { path: PROJECTS_PATH, component: ProjectsPage },
    { path: `${PROJECTS_PATH}/:projectId`, component: ProjectPage },
  ],
  navItems: [
    { title: 'Agents', url: AGENTS_PATH },
    { title: 'Projects', url: PROJECTS_PATH },
  ],
};
