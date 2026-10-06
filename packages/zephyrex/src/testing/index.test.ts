// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as testing from './index';

describe('zephyrex/testing', () => {
  it('publishes the test wrapper and the story root that extension packages render under', () => {
    expect(Object.keys(testing).sort()).toEqual(
      [
        'STORY_CONFIG',
        'TestWrapper',
        'ZephyrexStoryRoot',
        'loaded',
        'nth',
        'testConfig',
        'withSession',
        'withSignedIn',
        'withZephyrexApi',
        'wrapperWith',
      ].sort(),
    );
    expect(testing.STORY_CONFIG.app.name).toBe('Storybook');
    expect(testing.testConfig.app.name).toBe('Test App');
  });
});
