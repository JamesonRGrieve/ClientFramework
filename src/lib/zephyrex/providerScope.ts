// SPDX-License-Identifier: AGPL-3.0-or-later

/** A Provider supports an Extension (GET /v1/provider/extension). */
export interface ProviderExtensionLink {
  provider_id: string;
  extension_id: string;
}

export interface ScopedProvider {
  id: string;
  name: string;
  friendly_name?: string | null | undefined;
}

/** A user's or team's instance of a Provider: the level users create, edit and delete. `api_key` is write-only. */
export interface ProviderInstance {
  id: string;
  name: string;
  provider_id: string;
  model_name?: string | null | undefined;
  enabled?: boolean | null | undefined;
  scope?: 'root' | 'system' | 'team' | 'user' | undefined;
  created_at: string;
  updated_at?: string | null | undefined;
}

/** What the user has narrowed to; `null` means "any". */
export interface ProviderScopeSelection {
  extensionId: string | null;
  providerId: string | null;
}

export const EMPTY_SELECTION: ProviderScopeSelection = { extensionId: null, providerId: null };

export const providerLabel = (provider: ScopedProvider): string =>
  provider.friendly_name !== undefined && provider.friendly_name !== null && provider.friendly_name !== ''
    ? provider.friendly_name
    : provider.name;

/** Providers supporting the extension, or every provider when no extension is chosen. */
export function providersInExtension<P extends ScopedProvider>(
  providers: readonly P[],
  links: readonly ProviderExtensionLink[],
  extensionId: string | null,
): P[] {
  if (extensionId === null) {
    return [...providers];
  }
  const supported = new Set(links.filter((link) => link.extension_id === extensionId).map((link) => link.provider_id));
  return providers.filter((provider) => supported.has(provider.id));
}

/**
 * Scope first by extension, then by provider: the providers the extension allows, and the
 * instances of the chosen provider (or of any allowed provider when none is chosen).
 * A chosen provider outside the extension selects nothing.
 */
export function scopeProviderInstances<P extends ScopedProvider>(
  catalog: {
    providers: readonly P[];
    links: readonly ProviderExtensionLink[];
    instances: readonly ProviderInstance[];
  },
  selection: ProviderScopeSelection,
): { providers: P[]; instances: ProviderInstance[] } {
  const providers = providersInExtension(catalog.providers, catalog.links, selection.extensionId);
  const allowed = new Set(providers.map((provider) => provider.id));
  const instances = catalog.instances.filter(
    (instance) =>
      allowed.has(instance.provider_id) && (selection.providerId === null || instance.provider_id === selection.providerId),
  );
  return { providers, instances };
}

/** Changing the extension drops a provider it no longer allows. */
export function selectExtension(
  selection: ProviderScopeSelection,
  extensionId: string | null,
  providers: readonly ScopedProvider[],
  links: readonly ProviderExtensionLink[],
): ProviderScopeSelection {
  const stillAllowed =
    selection.providerId !== null &&
    providersInExtension(providers, links, extensionId).some((provider) => provider.id === selection.providerId);
  return { extensionId, providerId: stillAllowed ? selection.providerId : null };
}
