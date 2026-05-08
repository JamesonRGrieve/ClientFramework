import type { ExtensionMiddleware } from './types';

/**
 * Edge-runtime registry — kept React-free so middleware.tsx can import it
 * without dragging React or any client component into the edge bundle.
 *
 * Hooks follow the same shape as the existing `MiddlewareHook` contract used
 * in src/middleware.tsx: return `{ activated: true, response }` to short-circuit
 * the chain, or `{ activated: false, ... }` to fall through.
 */
export const extensionMiddleware: ReadonlyArray<ExtensionMiddleware> = [];

export type { ExtensionMiddleware, ExtensionMiddlewareResult } from './types';
