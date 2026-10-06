// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/ai-agents', () => {
  it('publishes the pages, the main reads and writes behind them, and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'AGENTS_PATH',
        'AbilitySchema',
        'AgentPage',
        'AgentSchema',
        'AgentsPage',
        'PROJECTS_PATH',
        'ProjectPage',
        'ProjectSchema',
        'ProjectsPage',
        'TriggerSchema',
        'TurnSchema',
        'abilityName',
        'agentPagePath',
        'aiAgentsExtension',
        'createAgent',
        'createProject',
        'createTrigger',
        'projectPagePath',
        'takeTurn',
        'useAbilities',
        'useAgent',
        'useAgentActions',
        'useAgents',
        'useProject',
        'useProjects',
        'useTriggers',
        'useTurns',
      ].sort(),
    );
  });
});
