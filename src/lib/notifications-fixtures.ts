const MINUTE_MS = 1000 * 60;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;

export interface NotificationFixture {
  conversationId: string;
  conversationName: string;
  messageId: string;
  content: string;
  createdAt: string;
  role: string;
}

/**
 * Placeholder notification data for the template. Downstream applications
 * replace this with data fetched from their own backend.
 */
export const dummyNotifications: NotificationFixture[] = [
  {
    conversationId: '1',
    conversationName: 'Project Discussion',
    messageId: 'm1',
    content: 'Alice mentioned you in the discussion',
    createdAt: new Date(Date.now() - MINUTE_MS * 5).toISOString(),
    role: 'mention',
  },
  {
    conversationId: '2',
    conversationName: 'Team Updates',
    messageId: 'm2',
    content: 'Bob shared a new document',
    createdAt: new Date(Date.now() - HOUR_MS).toISOString(),
    role: 'share',
  },
  {
    conversationId: '3',
    conversationName: 'Bug Reports',
    messageId: 'm3',
    content: 'Critical issue needs attention',
    createdAt: new Date(Date.now() - DAY_MS).toISOString(),
    role: 'alert',
  },
];
