// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { CONVERSATIONS_PATH, conversationPagePath } from './routes';

describe('conversation routes', () => {
  it('puts each conversation under the conversations page, its id escaped', () => {
    expect(CONVERSATIONS_PATH).toBe('/conversations');
    expect(conversationPagePath('c 1/2')).toBe('/conversations/c%201%2F2');
  });
});
