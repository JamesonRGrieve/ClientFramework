// SPDX-License-Identifier: AGPL-3.0-or-later
// Which compiled modules call React hooks that only exist in the browser build without being
// marked 'use client'. React's server build has none of these hooks, so a server component that
// renders such a module fails at request time (React error #441), long after the build passed.

/** Hooks React's server build lacks; `use`, `useId`, `useMemo`, `useCallback` and `useDebugValue` it has. */
const CLIENT_ONLY_HOOK =
  /\buse(?:State|Reducer|Effect|LayoutEffect|InsertionEffect|Ref|Context|SyncExternalStore|Transition|DeferredValue|Optimistic|ActionState|ImperativeHandle|FormStatus)\s*\(/;

// The directive must be the first statement; only comments and other directives may precede it.
const LEADING_DIRECTIVES = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/|(['"])use [a-z]+\1;?)*/;
const CLIENT_DIRECTIVE = /(['"])use client\1/;

/** Whether `source` is a module that calls a client-only React hook but isn't marked 'use client'. */
export function needsClientDirective(source: string): boolean {
  if (!CLIENT_ONLY_HOOK.test(source)) {
    return false;
  }
  const leading = LEADING_DIRECTIVES.exec(source)?.[0] ?? '';
  return !CLIENT_DIRECTIVE.test(leading);
}
