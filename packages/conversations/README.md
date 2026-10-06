# @zephyrex/conversations

Conversations in a Zephyrex app: direct messages and group chats between users, their threaded
messages, and who is in them. It is the client half of the Zephyrex server's `conversations`
extension.

## Install

```bash
pnpm add @zephyrex/conversations
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { conversationsExtension } from '@zephyrex/conversations';

const config: ZephyrexConfig = { extensions: [conversationsExtension] };
```

It adds these pages, and a **Conversations** menu entry:

- `/conversations`: the user's conversations.
- `/conversations/:conversationId`: one conversation, with its messages, files and participants.

## Exports

- Extension and pages: `conversationsExtension`, `ConversationsPage`, `ConversationPage`, and the paths
  `CONVERSATIONS_PATH` and `conversationPagePath`.
- Conversations: `useConversations`, `useConversation`, `useConversationActions`, `createGroupChat`,
  `openDirectMessage`.
- Messages: `useMessages`, `useMessageActions`, `sendMessage`, `sendVoiceMessage`.
- Participants: `useParticipants`, `useParticipantActions`, `addParticipant`.
- Feedback on messages: `useMyFeedback`, `useFeedbackActions`, `rateMessage`.
- Files made in the conversation: `useArtifacts`.
- The zod schemas and types for each.

## License

AGPL-3.0-or-later
