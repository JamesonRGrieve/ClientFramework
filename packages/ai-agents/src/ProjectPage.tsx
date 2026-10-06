// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useConversations } from '@zephyrex/conversations';
import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { conversationName } from './AgentConversations';
import {
  fileConversation,
  linkProjectPrompt,
  type Project,
  useProject,
  useProjectActions,
  useProjectContextPrompts,
  useProjectConversations,
  useProjectLinkActions,
  useProjects,
} from './projectsApi';
import { PromptLinks } from './PromptLinks';
import { PROJECTS_PATH } from './routes';

const TOP_LEVEL = '';
const SAVE_FAILURE = 'The project could not be saved.';
const REMOVE_FAILURE = 'The project could not be deleted.';

const CONFLICT_FIELDS: readonly ConflictField<Project>[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'parent_id', label: 'Inside', format: ({ parent_id: parent }) => parent ?? 'No other project' },
];

interface ProjectDraft {
  name: string;
  description: string;
  parentId: string;
}

const draftOf = ({ name, description, parent_id: parent }: Project): ProjectDraft => ({
  name,
  description: description ?? '',
  parentId: parent ?? TOP_LEVEL,
});

/** Only what the user changed, so a save never rewrites what someone else changed. */
export function projectChanges(project: Project, draft: ProjectDraft): Partial<Project> {
  const changes: Partial<Project> = {};
  if (draft.name.trim() !== project.name) {
    changes.name = draft.name.trim();
  }
  const description = draft.description.trim() === '' ? null : draft.description.trim();
  if (description !== (project.description ?? null)) {
    changes.description = description;
  }
  const parent = draft.parentId === TOP_LEVEL ? null : draft.parentId;
  if (parent !== (project.parent_id ?? null)) {
    changes.parent_id = parent;
  }
  return changes;
}

/** A project's name, description and place, saved over it as loaded; or deleting it. */
function ProjectDetails({ project }: { project: Project }): ReactElement {
  const router = useRouter();
  const ids = { name: useId(), description: useId(), parent: useId() };
  const { data: projects = [] } = useProjects();
  const { update, remove } = useProjectActions(project.id);
  const { base, rebaseOnSave } = useEditBase(project);
  const [draft, setDraft] = useDraft(base, draftOf);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const edit = <K extends keyof ProjectDraft>(field: K, value: ProjectDraft[K]): void => {
    setDraft((current) => ({ ...current, [field]: value }));
    setNotice(null);
  };

  const settleSave = async (saving: Promise<boolean>): Promise<void> => {
    try {
      setNotice((await rebaseOnSave(saving)) ? { text: 'Saved.', alert: false } : null);
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : SAVE_FAILURE, alert: true });
    }
  };
  const settleRemove = async (removing: Promise<boolean>): Promise<void> => {
    try {
      if (await removing) {
        router.push(PROJECTS_PATH);
      }
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : REMOVE_FAILURE, alert: true });
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (draft.name.trim() === '') {
      setNotice({ text: 'A project needs a name.', alert: true });
      return;
    }
    const changes = projectChanges(base, draft);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  return (
    <div className='grid gap-3'>
      <form aria-label='Project details' className='grid gap-3' noValidate onSubmit={submit}>
        <div className='grid gap-1'>
          <Label htmlFor={ids.name}>Name</Label>
          <Input id={ids.name} value={draft.name} onChange={(event) => edit('name', event.target.value)} />
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.description}>Description</Label>
          <Input
            id={ids.description}
            value={draft.description}
            onChange={(event) => edit('description', event.target.value)}
          />
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.parent}>Inside</Label>
          <select
            id={ids.parent}
            className='rounded-md border bg-background px-2 py-2 text-sm'
            value={draft.parentId}
            onChange={(event) => edit('parentId', event.target.value)}
          >
            <option value={TOP_LEVEL}>No other project</option>
            {projects
              .filter(({ id }) => id !== project.id)
              .map((other) => (
                <option key={other.id} value={other.id}>
                  {other.name}
                </option>
              ))}
          </select>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button type='submit'>Save project</Button>
          <Button
            type='button'
            variant='outline'
            className='ml-auto'
            onClick={() => {
              setNotice(null);
              void settleRemove(remove.save(project, {}));
            }}
          >
            Delete project
          </Button>
        </div>
      </form>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={CONFLICT_FIELDS}
          onResolve={(merged) => {
            void settleSave(update.resolve(merged));
          }}
          onDiscard={update.discard}
        />
      )}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Delete anyway'
          onResolve={(merged) => {
            void settleRemove(remove.resolve(merged));
          }}
          onDiscard={remove.discard}
        />
      )}
      {notice !== null && (
        <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
          {notice.text}
        </p>
      )}
    </div>
  );
}

/** The conversations filed in a project, unfiling each guarded by its link, and filing another of the user's. */
function ProjectConversations({ projectId }: { projectId: string }): ReactElement {
  const client = useClient();
  const id = useId();
  const { data: filed = [], mutate: refreshFiled } = useProjectConversations(projectId);
  const { data: conversations = [] } = useConversations();
  const { unfile } = useProjectLinkActions(projectId);
  const [chosen, setChosen] = useState(TOP_LEVEL);
  const [problem, setProblem] = useState<string | null>(null);
  const filedIds = new Set(filed.map(({ conversation_id: conversation }) => conversation));
  const settle = (writing: Promise<boolean | undefined>, fallback: string): void => {
    void writeProblem(writing, fallback).then(setProblem);
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (chosen === TOP_LEVEL) {
      setProblem('Choose a conversation.');
      return;
    }
    settle(
      (async (): Promise<undefined> => {
        await fileConversation(client, projectId, chosen);
        await refreshFiled();
        setChosen(TOP_LEVEL);
        return undefined;
      })(),
      'The conversation could not be filed.',
    );
  };

  return (
    <div className='grid gap-3'>
      {filed.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No conversations filed here.</p>
      ) : (
        <ul aria-label='Filed conversations' className='divide-y rounded-md border'>
          {filed.map((link) => (
            <li key={link.id} className='flex items-center justify-between gap-2 px-4 py-2 text-sm'>
              <span>
                {conversationName(conversations.find(({ id: conversation }) => conversation === link.conversation_id))}
              </span>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={() => settle(unfile.save(link, {}), 'It could not be unfiled.')}
              >
                Unfile
              </Button>
            </li>
          ))}
        </ul>
      )}
      {unfile.conflict !== null && (
        <ConflictPanel
          conflict={unfile.conflict}
          fields={[]}
          applyLabel='Unfile anyway'
          onResolve={(merged) => settle(unfile.resolve(merged), 'It could not be unfiled.')}
          onDiscard={unfile.discard}
        />
      )}
      <form aria-label='File it here' className='flex flex-wrap items-end gap-2' noValidate onSubmit={submit}>
        <div className='grid flex-1 gap-1'>
          <Label htmlFor={id}>File a conversation</Label>
          <select
            id={id}
            className='rounded-md border bg-background px-2 py-2 text-sm'
            value={chosen}
            onChange={(event) => setChosen(event.target.value)}
          >
            <option value={TOP_LEVEL}>Choose a conversation…</option>
            {conversations
              .filter(({ id: conversation }) => !filedIds.has(conversation))
              .map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversationName(conversation)}
                </option>
              ))}
          </select>
        </div>
        <Button type='submit'>File</Button>
      </form>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}

/** The prompts put into the context of the project's conversations. */
function ProjectContext({ projectId }: { projectId: string }): ReactElement {
  const client = useClient();
  const { data: links = [], mutate } = useProjectContextPrompts(projectId);
  const { unlinkPrompt } = useProjectLinkActions(projectId);
  return (
    <PromptLinks
      links={links}
      unlink={unlinkPrompt}
      link={async (promptId) => {
        await linkProjectPrompt(client, projectId, promptId);
        await mutate();
      }}
    />
  );
}

/** One project: its conversations, the prompts in their context, and its details. */
export function ProjectPage({ params }: { params: Record<string, string> }): ReactElement {
  const projectId = params['projectId'] ?? '';
  const { data: project, error, isLoading } = useProject(projectId);

  if (error !== undefined) {
    return (
      <p role='alert' className='p-4 text-sm text-destructive'>
        The project could not be loaded: {error.message}
      </p>
    );
  }
  if (project === undefined || project === null) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {isLoading ? 'Loading…' : 'This project does not exist or is not yours to see.'}{' '}
        <Link href={PROJECTS_PATH} className='underline'>
          Back to your projects
        </Link>
      </p>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={PROJECTS_PATH} className='text-sm text-muted-foreground underline'>
          Projects
        </Link>
        <h1 className='text-3xl font-semibold'>{project.name}</h1>
        {(project.description ?? '') !== '' && <p className='text-muted-foreground'>{project.description}</p>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectConversations projectId={project.id} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Context</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectContext projectId={project.id} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectDetails key={project.id} project={project} />
        </CardContent>
      </Card>
    </main>
  );
}
