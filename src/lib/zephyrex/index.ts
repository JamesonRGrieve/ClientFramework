// SPDX-License-Identifier: AGPL-3.0-or-later

// Core
export { ZephyrexApp } from './ZephyrexApp';
export { ZephyrexProvider, useZephyrexConfig } from './ZephyrexProvider';
export { ZephyrexRouter } from './ZephyrexRouter';
export { createMiddleware } from './createMiddleware';

// API Client
export { ZephyrexClient, ApiError, RateLimitError } from './client';
export type { ZephyrexClientConfig } from './client';

// Data Hooks
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
  useMarkNotificationRead,
  ADMIN_ROLE_ID,
  SUPERADMIN_ROLE_ID,
} from './hooks';
export type { User, Role, Team, TeamMembership, ServerExtension, Provider, Notification } from './hooks';

// Feature Hooks
export { useSearch } from './useSearch';
export type { SearchResult } from './useSearch';
export { useFileUpload } from './useFileUpload';
export type { UploadResult, UploadProgress } from './useFileUpload';
export { useSubscription } from './useSubscription';
export type { SubscriptionOptions } from './useSubscription';
export { useOnline } from './useOnline';
export { useRateLimit } from './useRateLimit';
export { useRootProviderStatus } from './useRootProviderStatus';
export type { RootProviderSetting, RootProviderStatusEntry, RootProviderStatusResponse } from './useRootProviderStatus';

// Components
export { RequireRole } from './components/RequireRole';
export { ErrorBoundary } from './components/ErrorBoundary';
export { NotificationBell } from './components/NotificationBell';
export { SearchInput } from './components/SearchInput';
export type { SearchInputProps } from './components/SearchInput';
export { RateLimitBanner } from './components/RateLimitBanner';
export { RootProviderStatus } from './components/RootProviderStatus';

// Page Injection
export { PageSlotsProvider, usePageSlots, PageWithSlots } from './PageSlots';
export type { PageSlotDefinition, PageSlots } from './PageSlots';

// Management Tab Injection
export { ManagementTabProvider, useManagementTabs } from './ManagementTabRegistry';

// Extension System
export { useActiveExtensions, AutoSettingsPanel } from './ExtensionRegistry';

// Types
export type {
  ZephyrexConfig,
  ZephyrexClientExtension,
  RouteDefinition,
  NavItemDefinition,
  MiddlewareHook,
  ManagementTab,
} from './types';
