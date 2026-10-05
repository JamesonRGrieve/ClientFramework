// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { PROMPTS_PATH, promptPagePath } from './routes';

describe('prompt routes', () => {
  it('puts each prompt under the prompts page, its id escaped', () => {
    expect(PROMPTS_PATH).toBe('/prompts');
    expect(promptPagePath('p 1/2')).toBe('/prompts/p%201%2F2');
  });
});
