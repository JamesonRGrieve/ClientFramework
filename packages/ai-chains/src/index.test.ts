// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/ai-chains', () => {
  it('publishes the pages, the main reads and writes behind them, and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'CHAINS_PATH',
        'ChainPage',
        'ChainRunSchema',
        'ChainSchema',
        'ChainStepSchema',
        'ChainsPage',
        'aiChainsExtension',
        'cancelRun',
        'chainPagePath',
        'createChain',
        'runChain',
        'useChain',
        'useChainRuns',
        'useChainSteps',
        'useChains',
      ].sort(),
    );
  });
});
