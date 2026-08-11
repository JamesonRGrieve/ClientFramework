'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { createContext } from 'react';

/**
 * Contract consumed by data-analysis renderers (e.g. {@link RendererXSV}).
 *
 * The concrete SDK is supplied by downstream applications via this context's
 * provider. The template ships the typed shape and a `null` default so the
 * framework compiles standalone; consuming apps wire in a real implementation.
 */
export interface InteractiveSDK {
  runChain: (
    chainName: string,
    userInput: string,
    agentName: string,
    useMemory: boolean,
    chainRunCount: number,
    chainArgs: Record<string, unknown>,
  ) => Promise<unknown>;
}

export interface InteractiveConfigOverrides {
  conversation: string;
}

export interface InteractiveConfig {
  sdk: InteractiveSDK;
  agent: string;
  overrides: InteractiveConfigOverrides;
}

export const InteractiveConfigContext = createContext<InteractiveConfig | null>(null);
