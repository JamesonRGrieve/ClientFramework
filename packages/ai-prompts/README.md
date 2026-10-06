# @zephyrex/ai-prompts

Stored AI prompts in a Zephyrex app: prompts with `{VARIABLE}` placeholders, their arguments'
defaults, and building a prompt from them. It is the client half of the Zephyrex server's
`ai_prompts` extension.

## Install

```bash
pnpm add @zephyrex/ai-prompts
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { aiPromptsExtension } from '@zephyrex/ai-prompts';

const config: ZephyrexConfig = { extensions: [aiPromptsExtension] };
```

It adds these pages, and a **Prompts** menu entry:

- `/prompts`: the user's prompts.
- `/prompts/:promptId`: one prompt, with its text, its arguments, and a form to build it.

## Exports

- Extension and pages: `aiPromptsExtension`, `PromptsPage`, `PromptPage`, and the paths `PROMPTS_PATH`
  and `promptPagePath`.
- Prompts: `usePrompts`, `usePrompt`, `usePromptActions`, `createPrompt`, `buildPrompt`,
  `variablesIn` and `MAX_PROMPT_CHARACTERS`.
- Arguments: `useArguments`, `useArgumentActions`, `createArgument`.
- The zod schemas and types for each.

## License

AGPL-3.0-or-later
