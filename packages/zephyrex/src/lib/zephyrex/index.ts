// SPDX-License-Identifier: AGPL-3.0-or-later

// Core
export { ZephyrexApp } from './ZephyrexApp';
export { ZephyrexProvider, useZephyrexConfig } from './ZephyrexProvider';
export { ZephyrexRouter } from './ZephyrexRouter';
export { createMiddleware, NONCE_HEADER } from './createMiddleware';
export { accountsEnabled, DEFAULT_AUTH_PATH, MANAGE_PAGE } from './authPath';
export type { CspAdditions, CspDirective } from './contentSecurityPolicy';

// API Client
export { ZephyrexClient, ApiError, RateLimitError, StaleWriteError, etagOf } from './client';
export type { ZephyrexClientConfig, JsonValue, JsonBody, Versioned } from './client';

// Data Hooks
export {
  ClientProvider,
  useClient,
  useHasSession,
  useUser,
  useRole,
  useTeams,
  useTeam,
  useSelectedTeam,
  SYSTEM_TEAM_ID,
  useServerExtensions,
  useProviders,
  useNotifications,
  useMarkNotificationRead,
  ADMIN_ROLE_ID,
  SUPERADMIN_ROLE_ID,
} from './hooks';
export type { User, Role, Team, TeamMembership, ServerExtension, Provider, Notification } from './hooks';
export { activeTeamId, setActiveTeam } from './cookies';

// Feature Hooks
export { useSearch } from './useSearch';
export type { SearchOptions, SearchState } from './useSearch';
export { useFileUpload } from './useFileUpload';
export type { UploadResult, UploadProgress } from './useFileUpload';
export { useSubscription } from './useSubscription';
export type { SubscriptionOptions } from './useSubscription';
export { useOnline } from './useOnline';
export { useGuardedSave, writeProblem } from './useGuardedSave';
export type { Conflict, GuardedSave } from './useGuardedSave';
export { useRateLimit } from './useRateLimit';
export { rootProviderStatusQuery, useRootProviderStatus } from './useRootProviderStatus';
export { sdkDownloadPath, useSdks } from './useSdks';
export type { Sdk } from './useSdks';
export { rootOnlyView } from './rootOnlyView';
export type { RootOnlyView } from './rootOnlyView';
export {
  useProviderExtensionLinks,
  useProviderInstances,
  useProviderInstanceDetail,
  useProviderInstanceActions,
} from './useProviderInstances';
export type {
  EditableProviderInstance,
  NewProviderInstance,
  ProviderInstanceActions,
  ProviderInstanceChanges,
  ProviderInstanceSetting,
  ProviderInstanceUsage,
} from './useProviderInstances';
export { fieldDescription, settingRows, useProviderSettingCatalogue } from './providerSettings';
export type { ProviderSettingRow, ProviderSettingSpec } from './providerSettings';
export {
  EMPTY_SELECTION,
  providerLabel,
  providersInExtension,
  scopeProviderInstances,
  selectExtension,
} from './providerScope';
export type { ProviderExtensionLink, ProviderInstance, ProviderScopeSelection, ScopedProvider } from './providerScope';
export type {
  ProviderHealth,
  RootProviderSetting,
  RootProviderStatusEntry,
  RootProviderStatusOptions,
  RootProviderStatusResponse,
} from './useRootProviderStatus';

// Components
export { RequireRole } from './components/RequireRole';
export { ErrorBoundary } from './components/ErrorBoundary';
export { NotificationBell } from './components/NotificationBell';
export { SearchInput } from './components/SearchInput';
export type { SearchInputProps } from './components/SearchInput';
export { RateLimitBanner } from './components/RateLimitBanner';
export { RootProviderStatus } from './components/RootProviderStatus';
export { SdkDownloads } from './components/SdkDownloads';
export { ConflictPanel } from './components/ConflictPanel';
export type { ConflictField } from './components/ConflictPanel';

// Page Injection
export { PageSlotsProvider, usePageSlots, PageWithSlots } from './PageSlots';
export type { PageSlotDefinition, PageSlots } from './PageSlots';

// Management Tab Injection
export {
  ManagementTabProvider,
  ManagementSections,
  collectTabs,
  managementAnchor,
  useManagementTabs,
  visibleTabs,
} from './ManagementTabRegistry';

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
  TeamSectionProps,
  AuthPageDefinition,
} from './types';
