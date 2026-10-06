// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { agentsFixture, PROJECT_ID } from './agents.mocks';
import { type ProjectBranch, projectForest, ProjectsPage } from './ProjectsPage';
import { renderAgents } from './testing.mocks';

const MAKE = 'Make project';

const namesOf = (branches: readonly ProjectBranch[]): unknown[] =>
  branches.map(({ project: { name }, children }) => [name, namesOf(children)]);

describe('projectForest', () => {
  it('nests each project under its parent, a project whose parent is out of sight at the top', () => {
    const { projects } = agentsFixture();
    const orphan = { ...rowOf(projects, 'mill'), id: 'orphan', name: 'Orphan', parent_id: 'hidden' };
    expect(namesOf(projectForest([...projects, orphan]))).toEqual([
      ['Engine', [['Mill', []]]],
      ['Orphan', []],
    ]);
  });
});

describe('ProjectsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the projects nested, each linking to its page', async () => {
    const view = renderAgents(<ProjectsPage />);
    const list = await view.findByRole('list', { name: 'Projects' });
    expect(list).toHaveTextContent('EngineMill');
    expect(within(list).getByRole('link', { name: 'Mill' })).toHaveAttribute('href', '/projects/mill');
  });

  it('makes a project inside another and opens it', async () => {
    const store = agentsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderAgents(<ProjectsPage />, store);
    await user.type(view.getByLabelText('Name'), 'Turbines');
    await user.selectOptions(view.getByLabelText('Inside'), await view.findByRole('option', { name: 'Engine' }));
    await user.click(view.getByRole('button', { name: MAKE }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/projects/project-1');
    });
    expect(store.projects.at(-1)).toMatchObject({ name: 'Turbines', parent_id: PROJECT_ID, description: null });
  });

  it('asks for a name, and says when there are no projects', async () => {
    const user = userEvent.setup();
    const view = renderAgents(<ProjectsPage />, { ...agentsFixture(), projects: [] });
    expect(await view.findByText('You have no projects yet.')).toBeInTheDocument();
    await user.click(view.getByRole('button', { name: MAKE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Give the project a name.');
  });
});
