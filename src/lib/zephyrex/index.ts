// SPDX-License-Identifier: AGPL-3.0-or-later

// Core
export { ZephyrexApp } from './ZephyrexApp';
export { ZephyrexProvider, useZephyrexConfig } from './ZephyrexProvider';
export { ZephyrexRouter } from './ZephyrexRouter';
export { createMiddleware } from './createMiddleware';

// API Client
export { ZephyrexClient, ApiError } from './client';
export type { ZephyrexClientConfig } from './client';

// Hooks
export {
  ClientProvider,
  useClient,
  useUser,
  useRole,
  useTeams,
  useTeam,
  useServerExtensions,
  useProviders,
  useNotifications,
} from './hooks';
export type { User, Team, ServerExtension, Provider, Notification } from './hooks';

// Page injection
export { PageSlotsProvider, usePageSlots, PageWithSlots } from './PageSlots';
export type { PageSlotDefinition, PageSlots } from './PageSlots';

// Extension system
export { useActiveExtensions, AutoSettingsPanel } from './ExtensionRegistry';

// Types
export type {
  ZephyrexConfig,
  ZephyrexClientExtension,
  RouteDefinition,
  NavItemDefinition,
  MiddlewareHook,
} from './types';
