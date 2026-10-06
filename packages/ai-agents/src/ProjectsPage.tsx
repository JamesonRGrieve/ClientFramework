// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { createProject, type Project, useProjects } from './projectsApi';
import { projectPagePath } from './routes';

const TOP_LEVEL = '';

/** A project and the projects nested in it, at any depth. */
export interface ProjectBranch {
  project: Project;
  children: ProjectBranch[];
}

/** The projects as a forest: each top-level project (or one whose parent the user can't see) with its children. */
export function projectForest(projects: readonly Project[]): ProjectBranch[] {
  const known = new Set(projects.map(({ id }) => id));
  const childrenOf = (parentId: string | null): ProjectBranch[] =>
    projects
      .filter(({ parent_id: parent }) =>
        parentId === null ? parent === null || parent === undefined || !known.has(parent) : parent === parentId,
      )
      .map((project) => ({ project, children: childrenOf(project.id) }));
  return childrenOf(null);
}

/** One project and, nested under it, its sub-projects. */
function Branch({ branch }: { branch: ProjectBranch }): ReactElement {
  return (
    <li className='grid gap-1'>
      <Link href={projectPagePath(branch.project.id)} className='font-medium hover:underline'>
        {branch.project.name}
      </Link>
      {branch.children.length > 0 && (
        <ul className='grid gap-1 border-l pl-4'>
          {branch.children.map((child) => (
            <Branch key={child.project.id} branch={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Make a project, inside another if chosen, then on to its page. */
function NewProjectForm(): ReactElement {
  const client = useClient();
  const router = useRouter();
  const { data: projects = [], mutate: refreshProjects } = useProjects();
  const ids = { name: useId(), parent: useId() };
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(TOP_LEVEL);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (name.trim() === '') {
      setProblem('Give the project a name.');
      return;
    }
    setPending(true);
    const creating = (async (): Promise<void> => {
      const project = await createProject(client, {
        name: name.trim(),
        description: null,
        parent_id: parentId === TOP_LEVEL ? null : parentId,
      });
      await refreshProjects();
      router.push(projectPagePath(project.id));
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(creating, 'The project could not be made.'));
      setPending(false);
    })();
  };

  return (
    <form
      aria-label='New project'
      className='grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end'
      noValidate
      onSubmit={submit}
    >
      <div className='grid gap-1'>
        <Label htmlFor={ids.name}>Name</Label>
        <Input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.parent}>Inside</Label>
        <select
          id={ids.parent}
          className='rounded-md border bg-background px-2 py-2 text-sm'
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
        >
          <option value={TOP_LEVEL}>No other project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <Button type='submit' disabled={pending}>
        Make project
      </Button>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive sm:col-span-3'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** The user's projects, nested as they are; and a form to make one. */
export function ProjectsPage(): ReactElement {
  const { data: projects = [], error, isLoading } = useProjects();
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Conversations filed together, with prompts put into their context.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          <NewProjectForm />
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The projects could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && projects.length === 0 && (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'You have no projects yet.'}</p>
          )}
          {projects.length > 0 && (
            <ul aria-label='Projects' className='grid gap-2 text-sm'>
              {projectForest(projects).map((branch) => (
                <Branch key={branch.project.id} branch={branch} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
