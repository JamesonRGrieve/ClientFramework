// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { AGENTS_PATH, agentPagePath, PROJECTS_PATH, projectPagePath } from './routes';

describe('agent routes', () => {
  it('puts each agent and project under its list page, the id escaped', () => {
    expect([AGENTS_PATH, PROJECTS_PATH]).toEqual(['/agents', '/projects']);
    expect(agentPagePath('a 1')).toBe('/agents/a%201');
    expect(projectPagePath('p/2')).toBe('/projects/p%2F2');
  });
});
