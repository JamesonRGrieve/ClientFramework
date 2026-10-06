// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { ApiError, type GuardedSave, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const PROJECT_ENDPOINT = '/v1/project';
export const PROJECT_CONTEXT_PROMPT_ENDPOINT = '/v1/project_context_prompt';
export const PROJECT_CONVERSATION_ENDPOINT = '/v1/project_conversation';

const HTTP_NOT_FOUND = 404;

const optionalText = z.string().nullable().optional();
const versioned = { created_at: optionalText, updated_at: optionalText };

/** A project: a container for conversations, with prompts put into their context; projects nest. */
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: optionalText,
  parent_id: optionalText,
  user_id: optionalText,
  team_id: optionalText,
  ...versioned,
});
export type Project = z.infer<typeof ProjectSchema>;

/** A prompt put into the context of the project's conversations. */
export const ProjectContextPromptSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  prompt_id: z.string(),
  ...versioned,
});
export type ProjectContextPrompt = z.infer<typeof ProjectContextPromptSchema>;

/** A conversation filed in the project. */
export const ProjectConversationSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  conversation_id: z.string(),
  ...versioned,
});
export type ProjectConversation = z.infer<typeof ProjectConversationSchema>;

const ProjectEnvelopeSchema = z.object({ project: ProjectSchema });

const path = (endpoint: string, id: string): string => `${endpoint}/${encodeURIComponent(id)}`;

/** The projects the user can see, by name. */
export function useProjects(): SWRResponse<Project[], Error> {
  const client = useClient();
  return useSWR<Project[], Error>(client.url(PROJECT_ENDPOINT), async () =>
    (await client.list(PROJECT_ENDPOINT, 'projects', ProjectSchema)).sort((a, b) => a.name.localeCompare(b.name)),
  );
}

/** One project, or `null` when it doesn't exist or isn't the user's to see (the server answers 404 for both). */
export function useProject(id: string): SWRResponse<Project | null, Error> {
  const client = useClient();
  return useSWR<Project | null, Error>(client.url(path(PROJECT_ENDPOINT, id)), async () => {
    try {
      return ProjectEnvelopeSchema.parse(await client.get(path(PROJECT_ENDPOINT, id))).project;
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

/** The project's context prompts. */
export function useProjectContextPrompts(projectId: string): SWRResponse<ProjectContextPrompt[], Error> {
  const client = useClient();
  const params = { project_id: projectId };
  return useSWR<ProjectContextPrompt[], Error>(client.url(PROJECT_CONTEXT_PROMPT_ENDPOINT, params), async () =>
    client.list(PROJECT_CONTEXT_PROMPT_ENDPOINT, 'project_context_prompts', ProjectContextPromptSchema, params),
  );
}

/** The conversations filed in the project. */
export function useProjectConversations(projectId: string): SWRResponse<ProjectConversation[], Error> {
  const client = useClient();
  const params = { project_id: projectId };
  return useSWR<ProjectConversation[], Error>(client.url(PROJECT_CONVERSATION_ENDPOINT, params), async () =>
    client.list(PROJECT_CONVERSATION_ENDPOINT, 'project_conversations', ProjectConversationSchema, params),
  );
}

/** What a new project is made from: a name, and the project it sits in, if any. */
export interface NewProject {
  name: string;
  description: string | null;
  parent_id: string | null;
}

/** Makes a project the user's; resolves to what the server stored. */
export async function createProject(client: ZephyrexClient, project: NewProject): Promise<Project> {
  const body = { project: { ...project } };
  return ProjectEnvelopeSchema.parse(await client.post(PROJECT_ENDPOINT, body)).project;
}

/** Puts a prompt into the context of the project's conversations. */
export async function linkProjectPrompt(client: ZephyrexClient, projectId: string, promptId: string): Promise<void> {
  await client.post(PROJECT_CONTEXT_PROMPT_ENDPOINT, {
    project_context_prompt: { project_id: projectId, prompt_id: promptId },
  });
}

/** Files a conversation in the project. */
export async function fileConversation(client: ZephyrexClient, projectId: string, conversationId: string): Promise<void> {
  await client.post(PROJECT_CONVERSATION_ENDPOINT, {
    project_conversation: { project_id: projectId, conversation_id: conversationId },
  });
}

export interface ProjectActions {
  /** `update.save(project, changes)`: change it, guarded by it as loaded. */
  update: GuardedSave<Project>;
  /** `remove.save(project, {})`: delete it, guarded by it as loaded. */
  remove: GuardedSave<Project>;
}

/** The writes to project `id`, each refreshing the projects (and the project) shown. */
export function useProjectActions(id: string): ProjectActions {
  const client = useClient();
  const { mutate: refreshProjects } = useProjects();
  const { mutate: refreshProject } = useProject(id);
  const update = useCallback(
    async (seen: Project, changes: Partial<Project>): Promise<void> => {
      await client.put(path(PROJECT_ENDPOINT, seen.id), { project: changes }, seen);
      await Promise.all([refreshProjects(), refreshProject()]);
    },
    [client, refreshProjects, refreshProject],
  );
  const remove = useCallback(
    async (seen: Project): Promise<void> => {
      await client.delete(path(PROJECT_ENDPOINT, seen.id), seen);
      await refreshProjects();
    },
    [client, refreshProjects],
  );
  return { update: useGuardedSave(update, ProjectSchema), remove: useGuardedSave(remove, ProjectSchema) };
}

/** Unlinking a project's context prompts and unfiling its conversations, each guarded by the link as loaded. */
export function useProjectLinkActions(projectId: string): {
  unlinkPrompt: GuardedSave<ProjectContextPrompt>;
  unfile: GuardedSave<ProjectConversation>;
} {
  const client = useClient();
  const { mutate: refreshPrompts } = useProjectContextPrompts(projectId);
  const { mutate: refreshConversations } = useProjectConversations(projectId);
  const unlinkPrompt = useCallback(
    async (seen: ProjectContextPrompt): Promise<void> => {
      await client.delete(path(PROJECT_CONTEXT_PROMPT_ENDPOINT, seen.id), seen);
      await refreshPrompts();
    },
    [client, refreshPrompts],
  );
  const unfile = useCallback(
    async (seen: ProjectConversation): Promise<void> => {
      await client.delete(path(PROJECT_CONVERSATION_ENDPOINT, seen.id), seen);
      await refreshConversations();
    },
    [client, refreshConversations],
  );
  return {
    unlinkPrompt: useGuardedSave(unlinkPrompt, ProjectContextPromptSchema),
    unfile: useGuardedSave(unfile, ProjectConversationSchema),
  };
}
