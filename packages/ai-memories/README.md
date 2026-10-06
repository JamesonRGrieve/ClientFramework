# @zephyrex/ai-memories

An AI agent's long-term memories in a Zephyrex app: what it keeps, keeping more, and recalling what
matters to a question. It is the client half of the Zephyrex server's `ai_memories` extension.

Memories belong to an agent, so this package has no pages of its own. `@zephyrex/ai-agents` shows
its `AgentMemories` panel on each agent's page.

## Install

```bash
pnpm add @zephyrex/ai-memories
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```tsx
import { AgentMemories } from '@zephyrex/ai-memories';

<AgentMemories agentId={agent.id} />;
```

## Exports

- Panel: `AgentMemories`.
- Data: `useMemories`, `useMemoryActions`, `remember`, `recall`, the limits `MAX_MEMORY_CHARACTERS`
  and `MAX_RECALL`, `MEMORY_ENDPOINT`, and `MemorySchema` with the types `Memory` and `NewMemory`.

## License

AGPL-3.0-or-later
