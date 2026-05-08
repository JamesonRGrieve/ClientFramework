import type { ReactNode } from 'react';
import type { ExtensionManifest, ExtensionNavItem, SlotId } from './types';
import exampleBanner from './example-banner';

/**
 * The single registry downstream forks edit. Each entry is a static manifest;
 * tree-shaking removes unused contributions. Replace, reorder, or extend.
 */
export const extensions: ReadonlyArray<ExtensionManifest> = [exampleBanner];

const byOrder = <T extends { order?: number }>(a: T, b: T): number => (a.order ?? 0) - (b.order ?? 0);

export function ExtensionProviders({ children }: { children: ReactNode }): ReactNode {
  const providers = extensions.flatMap((ext) => ext.providers ?? []);
  return providers.reduceRight<ReactNode>((tree, Provider) => <Provider>{tree}</Provider>, children);
}

export function getExtensionNav(): ReadonlyArray<ExtensionNavItem> {
  return [...extensions.flatMap((ext) => ext.nav ?? [])].sort(byOrder);
}

export function Slot({ id, fallback }: { id: SlotId | (string & {}); fallback?: ReactNode }): ReactNode {
  const contributions = extensions.flatMap((ext) => ext.slots ?? []).filter((slot) => slot.id === id);
  if (contributions.length === 0) {
    return <>{fallback ?? null}</>;
  }
  const sorted = [...contributions].sort(byOrder);
  return (
    <>
      {sorted.map((contribution, index) => {
        const Render = contribution.render;
        return <Render key={`${id}-${index}`} />;
      })}
    </>
  );
}

export type { ExtensionManifest, ExtensionNavItem, SlotId } from './types';
