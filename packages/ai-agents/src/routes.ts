// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the agent and project pages mount in the app (the extension's routes and links). */
export const AGENTS_PATH = '/agents';
export const PROJECTS_PATH = '/projects';

export const agentPagePath = (agentId: string): string => `${AGENTS_PATH}/${encodeURIComponent(agentId)}`;
export const projectPagePath = (projectId: string): string => `${PROJECTS_PATH}/${encodeURIComponent(projectId)}`;
