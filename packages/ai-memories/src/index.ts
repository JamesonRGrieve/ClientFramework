// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's AI memories extension (zephyrex[ai_memories]): what an agent keeps
// for the long term, keeping one, and recalling the most related by meaning or words. Memories are
// an agent's, so they have no page of their own: @zephyrex/ai-agents shows AgentMemories on each
// agent's page.
export { AgentMemories } from './AgentMemories';
export {
  MAX_MEMORY_CHARACTERS,
  MAX_RECALL,
  MEMORY_ENDPOINT,
  MemorySchema,
  recall,
  remember,
  useMemories,
  useMemoryActions,
} from './memoriesApi';
export type { Memory, NewMemory } from './memoriesApi';
