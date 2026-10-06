// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory agents server for the package's tests and stories (never compiled into dist): each
// resource as the server's REST routes (each change held to the row's version), and on top of them
// running a turn, a webhook trigger's secret, and a turn's activity tree. The prompts, memories and
// conversations the pages read are served too.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { notFound, restTable, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import {
  ABILITY_ENDPOINT,
  type Ability,
  AbilitySchema,
  type Agent,
  AGENT_ABILITY_ENDPOINT,
  AGENT_CONTEXT_PROMPT_ENDPOINT,
  AGENT_ENDPOINT,
  AGENT_MEMORY_ENDPOINT,
  type AgentAbility,
  AgentAbilitySchema,
  type AgentContextPrompt,
  AgentContextPromptSchema,
  AgentSchema,
  CONVERSATION_AGENT_ENDPOINT,
  type ConversationSeat,
  ConversationSeatSchema,
  type Rotation,
  ROTATION_ENDPOINT,
  RotationSchema,
  type ShortTermMemory,
  ShortTermMemorySchema,
} from './agentsApi';
import {
  type Project,
  PROJECT_CONTEXT_PROMPT_ENDPOINT,
  PROJECT_CONVERSATION_ENDPOINT,
  PROJECT_ENDPOINT,
  type ProjectContextPrompt,
  ProjectContextPromptSchema,
  type ProjectConversation,
  ProjectConversationSchema,
  ProjectSchema,
} from './projectsApi';
import {
  ACTIVITY_ENDPOINT,
  type Activity,
  INSTANCE_ENDPOINT,
  type Trigger,
  TRIGGER_ENDPOINT,
  TriggerSchema,
  type Turn,
  TurnSchema,
} from './triggersApi';

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';
export const AGENT_ID = 'scribe';
export const PROJECT_ID = 'engine';
export const TURN_ID = 'turn-1';

const PromptSchema = z.object({ id: z.string(), name: z.string(), favourite: z.boolean(), content: z.string() });
const ConversationSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  is_group_chat: z.boolean(),
  created_at: z.string(),
});
/** An activity as the server stores it: under the turn it was done in. */
type TurnActivity = Activity & { invocation_instance_id: string };

export interface AgentStore {
  agents: Agent[];
  abilities: Ability[];
  rotations: Rotation[];
  grants: AgentAbility[];
  workingMemory: ShortTermMemory[];
  agentPrompts: AgentContextPrompt[];
  seats: ConversationSeat[];
  triggers: Trigger[];
  turns: Turn[];
  activities: TurnActivity[];
  projects: Project[];
  projectPrompts: ProjectContextPrompt[];
  projectConversations: ProjectConversation[];
  prompts: z.infer<typeof PromptSchema>[];
  conversations: z.infer<typeof ConversationSchema>[];
}

const stamped = { created_at: FIXTURE_VERSION, updated_at: null };

const trigger = (id: string, fields: Partial<Trigger>): Trigger => ({
  id,
  agent_id: AGENT_ID,
  invocation_type: 'schedule',
  enabled: true,
  cron: null,
  interval_seconds: null,
  one_shot: false,
  event_source: null,
  event_filter: null,
  invocation_payload: null,
  due_at: null,
  priority: 3,
  last_fired_at: null,
  next_fire_at: null,
  fire_count: 0,
  email_address: null,
  ...stamped,
  ...fields,
});

const agent = (id: string, name: string, favourite: boolean, rotationId: string | null): Agent => ({
  id,
  name,
  favourite,
  rotation_id: rotationId,
  image_url: null,
  user_id: 'u-me',
  team_id: null,
  ...stamped,
});

const turn = (id: string, fields: Partial<Turn>): Turn => ({
  id,
  agent_id: AGENT_ID,
  invocation_trigger_id: null,
  trigger_message_id: null,
  status: 'succeeded',
  payload: null,
  error: null,
  started_at: null,
  completed_at: null,
  ...stamped,
  ...fields,
});

const project = (id: string, name: string, parentId: string | null): Project => ({
  id,
  name,
  description: null,
  parent_id: parentId,
  user_id: 'u-me',
  team_id: null,
  ...stamped,
});

/** One agent (a favourite) with a grant, working memory, a context prompt, a seat, two triggers and two turns; a project nesting another. */
export function agentsFixture(): AgentStore {
  return {
    agents: [agent('helper', 'Helper', false, null), agent(AGENT_ID, 'Scribe', true, 'fast')],
    abilities: [
      {
        id: 'ab-search',
        name: 'web_search',
        friendly_name: 'Search the web',
        description: 'Find pages about a topic',
        extension_id: 'ext-web',
        meta: false,
      },
      {
        id: 'ab-email',
        name: 'send_email',
        friendly_name: 'Send email',
        description: null,
        extension_id: 'ext-email',
        meta: false,
      },
    ],
    rotations: [{ id: 'fast', name: 'Fast models' }],
    grants: [{ id: 'grant-search', agent_id: AGENT_ID, ability_id: 'ab-search', enabled: true, ...stamped }],
    workingMemory: [{ id: 'wm-tone', agent_id: AGENT_ID, key: 'tone', content: 'Formal.', ...stamped }],
    agentPrompts: [{ id: 'acp-1', agent_id: AGENT_ID, prompt_id: 'style', ...stamped }],
    seats: [{ id: 'seat-1', agent_id: AGENT_ID, conversation_id: 'plans', active: true, auto_respond: false, ...stamped }],
    triggers: [
      trigger('every-monday', { cron: '0 9 * * 1', invocation_payload: 'Write the weekly summary.', fire_count: 2 }),
      trigger('hook', { invocation_type: 'event', event_source: 'webhook', priority: 1 }),
    ],
    turns: [
      turn(TURN_ID, {
        invocation_trigger_id: 'every-monday',
        payload: 'Write the weekly summary.',
        started_at: '2026-10-01T09:00:01',
        completed_at: '2026-10-01T09:00:09',
      }),
      turn('turn-2', { status: 'failed', error: 'No model answered', created_at: '2026-10-02T09:00:00' }),
    ],
    activities: [
      {
        id: 'act-search',
        invocation_instance_id: TURN_ID,
        title: 'Searched the web',
        body: 'engine news',
        state: 0,
        parent_id: null,
        ability_id: 'ab-search',
        artifact_id: null,
        created_at: '2026-10-01T09:00:02',
      },
      {
        id: 'act-page',
        invocation_instance_id: TURN_ID,
        title: 'Read a page',
        body: '',
        state: 1,
        parent_id: 'act-search',
        ability_id: 'ab-search',
        artifact_id: null,
        created_at: '2026-10-01T09:00:03',
      },
    ],
    projects: [project(PROJECT_ID, 'Engine', null), project('mill', 'Mill', PROJECT_ID)],
    projectPrompts: [],
    projectConversations: [{ id: 'pc-1', project_id: PROJECT_ID, conversation_id: 'plans', ...stamped }],
    prompts: [
      { id: 'style', name: 'House style', favourite: true, content: 'Write plainly.' },
      { id: 'brief', name: 'Brief', favourite: false, content: 'Be brief.' },
    ],
    conversations: [
      { id: 'plans', name: 'Engine plans', is_group_chat: true, created_at: FIXTURE_VERSION },
      { id: 'notes', name: 'Notes', is_group_chat: true, created_at: FIXTURE_VERSION },
    ],
  };
}

const TurnBodySchema = z.object({ payload: z.string().nullable().optional() });

/** The agent and project routes over `store`, with the prompts, memories and conversations the pages read. */
export function agentHandlers(store: AgentStore = agentsFixture()): RequestHandler[] {
  let ran = 0;
  return [
    http.post(`*${AGENT_ENDPOINT}/:id/turn`, async ({ params: { id }, request }) => {
      const found = store.agents.find((row) => row.id === id);
      if (found === undefined) {
        return notFound();
      }
      const { payload } = TurnBodySchema.parse(await request.json());
      ran += 1;
      const done = turn(`turn-new-${String(ran)}`, {
        agent_id: found.id,
        payload: payload ?? null,
        started_at: versionStamp(),
        completed_at: versionStamp(),
        created_at: versionStamp(),
      });
      store.turns.push(done);
      return HttpResponse.json(done);
    }),
    http.post(`*${TRIGGER_ENDPOINT}/:id/webhook-secret`, ({ params: { id } }) =>
      HttpResponse.json({
        trigger_id: id,
        secret: 'whsec-shown-once',
        timestamp_header: 'X-Zephyrex-Timestamp',
        signature_header: 'X-Zephyrex-Signature',
      }),
    ),
    http.get(`*${ACTIVITY_ENDPOINT}/hierarchy/:turnId`, ({ params: { turnId } }) => {
      const of = store.activities.filter(({ invocation_instance_id: owner }) => owner === turnId);
      const tree = (parentId: string | null): Record<string, object> =>
        Object.fromEntries(
          of
            .filter(({ parent_id: parent }) => (parent ?? null) === parentId)
            .map((activity) => [activity.id, { activity, children: tree(activity.id) }]),
        );
      return HttpResponse.json({ activities: tree(null) });
    }),
    ...restTable({
      rows: () => store.agents,
      set: (rows) => (store.agents = rows),
      schema: AgentSchema,
      endpoint: AGENT_ENDPOINT,
      single: 'agent',
      plural: 'agents',
      filters: [],
      defaults: { favourite: false, user_id: 'u-me' },
    }),
    ...restTable({
      rows: () => store.abilities,
      set: (rows) => (store.abilities = rows),
      schema: AbilitySchema,
      endpoint: ABILITY_ENDPOINT,
      single: 'ability',
      plural: 'abilities',
      filters: [],
    }),
    ...restTable({
      rows: () => store.rotations,
      set: (rows) => (store.rotations = rows),
      schema: RotationSchema,
      endpoint: ROTATION_ENDPOINT,
      single: 'rotation',
      plural: 'rotations',
      filters: [],
    }),
    ...restTable({
      rows: () => store.grants,
      set: (rows) => (store.grants = rows),
      schema: AgentAbilitySchema,
      endpoint: AGENT_ABILITY_ENDPOINT,
      single: 'agent_ability',
      plural: 'agent_abilities',
      filters: ['agent_id'],
    }),
    ...restTable({
      rows: () => store.workingMemory,
      set: (rows) => (store.workingMemory = rows),
      schema: ShortTermMemorySchema,
      endpoint: AGENT_MEMORY_ENDPOINT,
      single: 'agent_memory',
      plural: 'agent_memories',
      filters: ['agent_id'],
    }),
    ...restTable({
      rows: () => store.agentPrompts,
      set: (rows) => (store.agentPrompts = rows),
      schema: AgentContextPromptSchema,
      endpoint: AGENT_CONTEXT_PROMPT_ENDPOINT,
      single: 'agent_context_prompt',
      plural: 'agent_context_prompts',
      filters: ['agent_id'],
    }),
    ...restTable({
      rows: () => store.seats,
      set: (rows) => (store.seats = rows),
      schema: ConversationSeatSchema,
      endpoint: CONVERSATION_AGENT_ENDPOINT,
      single: 'conversation_agent',
      plural: 'conversation_agents',
      filters: ['agent_id'],
    }),
    ...restTable({
      rows: () => store.triggers,
      set: (rows) => (store.triggers = rows),
      schema: TriggerSchema,
      endpoint: TRIGGER_ENDPOINT,
      single: 'invocation_trigger',
      plural: 'invocation_triggers',
      filters: ['agent_id'],
      defaults: { fire_count: 0 },
    }),
    ...restTable({
      rows: () => store.turns,
      set: (rows) => (store.turns = rows),
      schema: TurnSchema,
      endpoint: INSTANCE_ENDPOINT,
      single: 'invocation_instance',
      plural: 'invocation_instances',
      filters: ['agent_id'],
    }),
    ...restTable({
      rows: () => store.projects,
      set: (rows) => (store.projects = rows),
      schema: ProjectSchema,
      endpoint: PROJECT_ENDPOINT,
      single: 'project',
      plural: 'projects',
      filters: [],
    }),
    ...restTable({
      rows: () => store.projectPrompts,
      set: (rows) => (store.projectPrompts = rows),
      schema: ProjectContextPromptSchema,
      endpoint: PROJECT_CONTEXT_PROMPT_ENDPOINT,
      single: 'project_context_prompt',
      plural: 'project_context_prompts',
      filters: ['project_id'],
    }),
    ...restTable({
      rows: () => store.projectConversations,
      set: (rows) => (store.projectConversations = rows),
      schema: ProjectConversationSchema,
      endpoint: PROJECT_CONVERSATION_ENDPOINT,
      single: 'project_conversation',
      plural: 'project_conversations',
      filters: ['project_id'],
    }),
    ...restTable({
      rows: () => store.prompts,
      set: (rows) => (store.prompts = rows),
      schema: PromptSchema,
      endpoint: '/v1/prompt',
      single: 'prompt',
      plural: 'prompts',
      filters: [],
    }),
    ...restTable({
      rows: () => store.conversations,
      set: (rows) => (store.conversations = rows),
      schema: ConversationSchema,
      endpoint: '/v1/conversation',
      single: 'conversation',
      plural: 'conversations',
      filters: [],
    }),
    http.get('*/v1/memory', () => HttpResponse.json({ memories: [] })),
  ];
}
