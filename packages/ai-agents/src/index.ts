// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's AI agents extension (zephyrex[ai_agents]): agents and what they may
// use, their context and working memory (and, from @zephyrex/ai-memories, their long-term memory),
// what makes them take turns and what they did, the conversations they take part in, and projects.
export { aiAgentsExtension } from './extension';
export { AgentPage } from './AgentPage';
export { AgentsPage } from './AgentsPage';
export { ProjectPage } from './ProjectPage';
export { ProjectsPage } from './ProjectsPage';
export { AGENTS_PATH, agentPagePath, PROJECTS_PATH, projectPagePath } from './routes';
export { AbilitySchema, AgentSchema, createAgent, useAbilities, useAgent, useAgentActions, useAgents } from './agentsApi';
export { abilityName } from './AgentAbilities';
export type { Ability, Agent, AgentActions, NewAgent } from './agentsApi';
export { createTrigger, takeTurn, TriggerSchema, TurnSchema, useTriggers, useTurns } from './triggersApi';
export type { Trigger, TriggerFields, Turn } from './triggersApi';
export { createProject, ProjectSchema, useProject, useProjects } from './projectsApi';
export type { NewProject, Project } from './projectsApi';
