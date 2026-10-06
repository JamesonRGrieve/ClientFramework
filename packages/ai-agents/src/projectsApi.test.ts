// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { loaded, TestWrapper, testConfig } from 'zephyrex/testing';
import { type Call, rowOf, writesOf } from 'zephyrex/testing/msw';
import { agentsFixture, FIXTURE_VERSION, PROJECT_ID } from './agents.mocks';
import {
  createProject,
  fileConversation,
  linkProjectPrompt,
  useProject,
  useProjectActions,
  useProjectContextPrompts,
  useProjectConversations,
  useProjectLinkActions,
  useProjects,
} from './projectsApi';
import { recordCalls } from './testing.mocks';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
const LOADED = `"${FIXTURE_VERSION}"`;

describe('the projects API', () => {
  let store = agentsFixture();
  let calls: Call[] = [];

  beforeEach(() => {
    store = agentsFixture();
    calls = recordCalls(store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the projects by name, one project or null, and a project’s prompts and conversations', async () => {
    expect((await loaded(() => useProjects())).map(({ id }) => id)).toEqual([PROJECT_ID, 'mill']);
    expect(await loaded(() => useProject('gone'))).toBeNull();
    expect(await loaded(() => useProjectContextPrompts(PROJECT_ID))).toEqual([]);
    expect((await loaded(() => useProjectConversations(PROJECT_ID))).map(({ conversation_id: id }) => id)).toEqual([
      'plans',
    ]);
  });

  it('makes a project and its links, and guards each change by the row as loaded', async () => {
    await expect(
      createProject(client, { name: 'Turbines', description: null, parent_id: PROJECT_ID }),
    ).resolves.toMatchObject({
      id: 'project-1',
      parent_id: PROJECT_ID,
    });
    await linkProjectPrompt(client, PROJECT_ID, 'style');
    await fileConversation(client, PROJECT_ID, 'notes');
    const engine = renderHook(() => useProjectActions(PROJECT_ID), { wrapper: TestWrapper }).result;
    const mill = renderHook(() => useProjectActions('mill'), { wrapper: TestWrapper }).result;
    const links = renderHook(() => useProjectLinkActions(PROJECT_ID), { wrapper: TestWrapper }).result;
    await expect(engine.current.update.save(rowOf(store.projects, PROJECT_ID), { description: 'Rebuild' })).resolves.toBe(
      true,
    );
    await expect(mill.current.remove.save(rowOf(store.projects, 'mill'), {})).resolves.toBe(true);
    await expect(links.current.unfile.save(rowOf(store.projectConversations, 'pc-1'), {})).resolves.toBe(true);
    expect(writesOf(calls)).toEqual([
      ['POST', '/v1/project', '{"project":{"name":"Turbines","description":null,"parent_id":"engine"}}', null],
      ['POST', '/v1/project_context_prompt', '{"project_context_prompt":{"project_id":"engine","prompt_id":"style"}}', null],
      [
        'POST',
        '/v1/project_conversation',
        '{"project_conversation":{"project_id":"engine","conversation_id":"notes"}}',
        null,
      ],
      ['PUT', '/v1/project/engine', '{"project":{"description":"Rebuild"}}', LOADED],
      ['DELETE', '/v1/project/mill', undefined, LOADED],
      ['DELETE', '/v1/project_conversation/pc-1', undefined, LOADED],
    ]);
  });

  it('unlinks a prompt guarded by the link as loaded', async () => {
    await linkProjectPrompt(client, PROJECT_ID, 'style');
    const link = rowOf(store.projectPrompts, 'project_context_prompt-1');
    const links = renderHook(() => useProjectLinkActions(PROJECT_ID), { wrapper: TestWrapper }).result;
    await expect(links.current.unlinkPrompt.save(link, {})).resolves.toBe(true);
    expect(store.projectPrompts).toEqual([]);
    expect(writesOf(calls).at(-1)).toEqual([
      'DELETE',
      '/v1/project_context_prompt/project_context_prompt-1',
      undefined,
      `"${String(link.created_at)}"`,
    ]);
  });
});
