// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createContext, type ReactElement, type ReactNode, useContext } from 'react';
import { FAMILY_TREE, type GenealogyOptions } from './options';

const OptionsContext = createContext<GenealogyOptions>(FAMILY_TREE);

export function useGenealogyOptions(): GenealogyOptions {
  return useContext(OptionsContext);
}

/** Gives the genealogy pages under it the app's `options`. */
export function GenealogyOptionsProvider({
  options,
  children,
}: {
  options: GenealogyOptions;
  children?: ReactNode;
}): ReactElement {
  return <OptionsContext.Provider value={options}>{children}</OptionsContext.Provider>;
}
