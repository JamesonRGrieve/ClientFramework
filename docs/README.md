# Zephyrex Client Framework

Installable Next.js framework for building apps on the Zephyrex server. Ships a complete app shell with auth, team management, provider settings, and a registry entry for each of the server's extensions. Each extension with a UI has its own package.

## Packages

| Package                                                                      | What it is                                                                   | Server extension      |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------- |
| [`zephyrex`](../packages/zephyrex/README.md)                                 | The app shell, auth pages, hooks, UI and extension registry. **Start here.** | (the core)            |
| [`@zephyrex/ai-agents`](../packages/ai-agents/README.md)                     | Agents, their abilities, memories, triggers and turns, and projects          | `ai_agents`           |
| [`@zephyrex/ai-chains`](../packages/ai-chains/README.md)                     | Chains of AI steps, running them, and their runs                             | `ai_chains`           |
| [`@zephyrex/ai-memories`](../packages/ai-memories/README.md)                 | An agent's long-term memories                                                | `ai_memories`         |
| [`@zephyrex/ai-prompts`](../packages/ai-prompts/README.md)                   | Stored prompts and their arguments                                           | `ai_prompts`          |
| [`@zephyrex/auth-api-keys`](../packages/auth-api-keys/README.md)             | The user's API keys                                                          | `auth_api_keys`       |
| [`@zephyrex/auth-device-pairing`](../packages/auth-device-pairing/README.md) | Signing in on a new device from a signed-in one                              | `auth_device_pairing` |
| [`@zephyrex/auth-invitations`](../packages/auth-invitations/README.md)       | Team invitations                                                             | `auth_invitations`    |
| [`@zephyrex/auth-magic-link`](../packages/auth-magic-link/README.md)         | Signing in from an emailed link                                              | `auth_magic_link`     |
| [`@zephyrex/auth-mfa`](../packages/auth-mfa/README.md)                       | Two-factor authentication                                                    | `auth_mfa`            |
| [`@zephyrex/auth-session`](../packages/auth-session/README.md)               | The user's active sessions                                                   | `auth_session`        |
| [`@zephyrex/book`](../packages/book/README.md)                               | Books and chapters, with exports                                             | `book`                |
| [`@zephyrex/conversations`](../packages/conversations/README.md)             | Direct messages and group chats                                              | `conversations`       |
| [`@zephyrex/ecommerce`](../packages/ecommerce/README.md)                     | Store orders, products, returns and sales                                    | `ecommerce`           |
| [`@zephyrex/erp`](../packages/erp/README.md)                                 | ERPNext DocTypes and documents, live on the site                             | `erp`                 |
| [`@zephyrex/genealogy`](../packages/genealogy/README.md)                     | Family trees, kinship and GEDCOM                                             | `genealogy`           |
| [`@zephyrex/health`](../packages/health/README.md)                           | A log of activities, meals, weights and sleep                                | `health`              |
| [`@zephyrex/observability`](../packages/observability/README.md)             | The server's metrics backend and error reporter                              | `observability`       |
| [`@zephyrex/payment`](../packages/payment/README.md)                         | The subscribe page                                                           | `payment`             |
| [`@zephyrex/social`](../packages/social/README.md)                           | What was published to the user's social accounts                             | `social`              |
| [`@zephyrex/webauthn-consumer`](../packages/webauthn-consumer/README.md)     | Passkey sign-in and the user's passkeys                                      | `webauthn_consumer`   |
| [`@zephyrex/webhooks`](../packages/webhooks/README.md)                       | Outbound webhook subscriptions and deliveries                                | `webhooks`            |

`@zephyrex/auth` (the auth pages' components) is its own repository, consumed as a dependency.

## Development (Framework Contributors)

```bash
git clone git@github.com:JamesonRGrieve/ClientFramework.git
cd ClientFramework
pnpm install
pnpm dev          # Dev server on port 1109
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright integration tests
pnpm storybook    # Storybook on port 3001
pnpm build        # Production build (Next 16 Turbopack)
```

## License

AGPL-3.0-or-later
