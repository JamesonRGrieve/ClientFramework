// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/ai-memories', () => {
  it('publishes the agent memories panel and the reads and writes behind it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'AgentMemories',
        'MAX_MEMORY_CHARACTERS',
        'MAX_RECALL',
        'MEMORY_ENDPOINT',
        'MemorySchema',
        'recall',
        'remember',
        'useMemories',
        'useMemoryActions',
      ].sort(),
    );
  });
});
