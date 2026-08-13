// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AuthFlowInjection, ZephyrexClientExtension } from './types';

interface AuthFlowContextValue {
  injections: AuthFlowInjection[];
}

const AuthFlowContext = createContext<AuthFlowContextValue>({ injections: [] });

export function useAuthFlowInjections(): AuthFlowInjection[] {
  return useContext(AuthFlowContext).injections;
}

export function AuthFlowProvider({ extensions, children }: { extensions: ZephyrexClientExtension[]; children: ReactNode }) {
  const injections = useMemo(() => extensions.filter((ext) => ext.authFlow).map((ext) => ext.authFlow!), [extensions]);

  return <AuthFlowContext value={{ injections }}>{children}</AuthFlowContext>;
}
