// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { agentsFixture, PROJECT_ID } from './agents.mocks';
import { ProjectPage, projectChanges } from './ProjectPage';
import { renderAgents } from './testing.mocks';

const SAVE = 'Save project';

describe('projectChanges', () => {
  const engine = rowOf(agentsFixture().projects, PROJECT_ID);
  const draft = { name: 'Engine', description: '', parentId: '' };

  it('keeps only what changed, trimmed, a blank description and no parent being none', () => {
    expect(projectChanges(engine, { ...draft, name: ' Engine ', description: ' ' })).toEqual({});
    expect(projectChanges(engine, { ...draft, description: ' Rebuild ', parentId: 'mill' })).toEqual({
      description: 'Rebuild',
      parent_id: 'mill',
    });
  });
});

describe('ProjectPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the project, its filed conversations and its context', async () => {
    const view = renderAgents(<ProjectPage params={{ projectId: PROJECT_ID }} />);
    expect(await view.findByRole('heading', { name: 'Engine', level: 1 })).toBeInTheDocument();
    expect(await view.findByRole('list', { name: 'Filed conversations' })).toHaveTextContent('Engine plans');
    expect(view.getByText('No context prompts.')).toBeInTheDocument();
  });

  it('files a conversation, unfiles one, and links a prompt', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<ProjectPage params={{ projectId: PROJECT_ID }} />, store);
    await user.click(await view.findByRole('button', { name: 'File' }));
    expect(await view.findByRole('alert')).toHaveTextContent('Choose a conversation.');
    await user.selectOptions(view.getByLabelText('File a conversation'), await view.findByRole('option', { name: 'Notes' }));
    await user.click(view.getByRole('button', { name: 'File' }));
    await vi.waitFor(() => {
      expect(store.projectConversations.map(({ conversation_id: id }) => id)).toEqual(['plans', 'notes']);
    });
    await user.click(nth(await view.findAllByRole('button', { name: 'Unfile' }), 0));
    await vi.waitFor(() => {
      expect(store.projectConversations.map(({ conversation_id: id }) => id)).toEqual(['notes']);
    });
    await user.selectOptions(view.getByLabelText('Add a prompt'), await view.findByRole('option', { name: 'Brief' }));
    await user.click(view.getByRole('button', { name: 'Link' }));
    await vi.waitFor(() => {
      expect(store.projectPrompts.map(({ prompt_id: id }) => id)).toEqual(['brief']);
    });
  });

  it('saves a change to the project, and keeps the user’s beside it as it is now when it changed first', async () => {
    const store = agentsFixture();
    const user = userEvent.setup();
    const view = renderAgents(<ProjectPage params={{ projectId: PROJECT_ID }} />, store);
    await user.type(await view.findByLabelText('Description'), 'Rebuild');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(rowOf(store.projects, PROJECT_ID).description).toBe('Rebuild');
    store.projects = store.projects.map((row) =>
      row.id === PROJECT_ID ? { ...row, name: 'Renamed first', updated_at: '2026-10-09T08:00:00.000001' } : row,
    );
    const name = view.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Mine');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('radio', { name: 'Current: Renamed first' })).not.toBeChecked();
  });

  it('wants a name, and deletes the project back to the projects', async () => {
    const store = agentsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderAgents(<ProjectPage params={{ projectId: PROJECT_ID }} />, store);
    await user.click(await view.findByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Nothing to save.');
    await user.clear(view.getByLabelText('Name'));
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('alert')).toHaveTextContent('A project needs a name.');
    await user.click(view.getByRole('button', { name: 'Delete project' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/projects');
    });
    expect(store.projects.some(({ id }) => id === PROJECT_ID)).toBe(false);
  });

  it('says when the project does not exist or is not the user’s', async () => {
    const view = renderAgents(<ProjectPage params={{ projectId: 'gone' }} />);
    expect(await view.findByText(/This project does not exist or is not yours to see\./)).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Back to your projects' })).toHaveAttribute('href', '/projects');
  });
});
