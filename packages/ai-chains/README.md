# @zephyrex/ai-chains

AI chains in a Zephyrex app: chains of steps (prompts, abilities, conditions and variables), running
them, and what each run did. It is the client half of the Zephyrex server's `ai_chains` extension.

## Install

```bash
pnpm add @zephyrex/ai-chains @zephyrex/ai-agents @zephyrex/ai-prompts
```

Peer dependencies: `zephyrex`, `@zephyrex/ai-agents`, `@zephyrex/ai-prompts`, `@jgrieve/forms`,
`next`, `react`, `swr` and `zod`.

## Use

```typescript
import { aiChainsExtension } from '@zephyrex/ai-chains';

const config: ZephyrexConfig = { extensions: [aiChainsExtension] };
```

It adds these pages, and a **Chains** menu entry:

- `/chains`: the user's chains.
- `/chains/:chainId`: one chain, with its steps, a form to run it, and its runs.

## Exports

- Extension and pages: `aiChainsExtension`, `ChainsPage`, `ChainPage`, and the paths `CHAINS_PATH` and
  `chainPagePath`.
- Data: `useChains`, `useChain`, `useChainSteps`, `useChainRuns`, `createChain`, `runChain` and
  `cancelRun`, plus the schemas and types `Chain`, `ChainStep`, `ChainRun`, `Inputs` and `NewChain`.

## License

AGPL-3.0-or-later
