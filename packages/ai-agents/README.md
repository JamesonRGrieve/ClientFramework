# @zephyrex/ai-agents

AI agents in a Zephyrex app: the user's agents, the abilities they may use, what they remember,
what makes them take turns and what each turn did, and projects. It is the client half of the
Zephyrex server's `ai_agents` extension.

## Install

```bash
pnpm add @zephyrex/ai-agents @zephyrex/ai-memories @zephyrex/ai-prompts @zephyrex/conversations
```

Peer dependencies: `zephyrex`, `@zephyrex/ai-memories`, `@zephyrex/ai-prompts`,
`@zephyrex/conversations`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { aiAgentsExtension } from '@zephyrex/ai-agents';

const config: ZephyrexConfig = { extensions: [aiAgentsExtension] };
```

It adds these pages, and **Agents** and **Projects** menu entries:

- `/agents` and `/agents/:agentId`: the user's agents. An agent's page holds its abilities, its
  memories (from `@zephyrex/ai-memories`), its triggers and its turns.
- `/projects` and `/projects/:projectId`: the user's projects.

## Exports

- Extension and pages: `aiAgentsExtension`, `AgentsPage`, `AgentPage`, `ProjectsPage`, `ProjectPage`,
  and the paths `AGENTS_PATH`, `agentPagePath`, `PROJECTS_PATH` and `projectPagePath`.
- Agents: `useAgents`, `useAgent`, `useAgentActions`, `createAgent`, `useAbilities`, `abilityName`.
- Triggers and turns: `useTriggers`, `createTrigger`, `useTurns`, `takeTurn`.
- Projects: `useProjects`, `useProject`, `createProject`.
- The zod schemas and types for each.

## License

AGPL-3.0-or-later
