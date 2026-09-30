// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { NextRequest, NextResponse } from 'next/server.js';
import type { CspAdditions } from './contentSecurityPolicy';
import type { PageSlots } from './PageSlots';

export interface RouteDefinition {
  path: string;
  component: ComponentType<{ params: Record<string, string>; searchParams: Record<string, string> }>;
}

export interface NavItemDefinition {
  title: string;
  url: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItemDefinition[];
}

export type MiddlewareHook = (req: NextRequest) => Promise<{ activated: boolean; response: NextResponse }>;

// --- Management page injection ---

/** An account-page section an extension adds; `id` is its anchor (`#manage-<id>`). */
export interface ManagementTab {
  id: string;
  label: string;
  /** Rendered as an element inside Suspense, so a `lazy()` component loads on demand. */
  component: ComponentType | LazyExoticComponent<ComponentType>;
  /** Only show for these roles. Omit = show for all authenticated users. */
  requireRole?: 'admin' | 'superadmin';
  priority?: number;
}

// --- Full extension contract ---

export interface ZephyrexClientExtension {
  name: string;
  displayName?: string;
  description?: string;
  serverExtension?: string;

  // Routing
  pages?: RouteDefinition[];
  navItems?: NavItemDefinition[];
  middleware?: MiddlewareHook[];

  // Providers (React context wrappers)
  providers?: ComponentType<{ children: ReactNode }>[];

  // Settings
  settingsPanel?: ComponentType;

  // Page content injection
  pageSlots?: PageSlots;

  // Management page tabs (/user/manage)
  managementTabs?: ManagementTab[];
}

export interface ZephyrexConfig {
  server: {
    /**
     * Where the browser calls the API. Sessions are HttpOnly cookies, so this should be the app's own
     * origin: '' or '/api' with the app proxying `/v1` and `/graphql` to `upstreamUrl`.
     */
    baseUrl: string;
    /** Where the Next server reaches the API (the proxy target), e.g. `http://server:1996`. */
    upstreamUrl?: string;
    graphqlPath?: string;
  };
  app: {
    name: string;
    description?: string;
    defaultTheme?: 'dark' | 'light';
    logo?: ComponentType;
    landingPage?: ComponentType;
  };
  auth?: {
    /**
     * `false` for an app without accounts: no session guard in the middleware, and no sign-in
     * entry points in the shell. On by default.
     */
    enabled?: boolean;
    /** Path prefixes that need a signed-in user. */
    privateRoutes?: string[];
    /** Where the auth pages are mounted; `/user` by default. */
    authPath?: string;
    /** Email sign-in: `basic` (password) or `magical` (magic link); password by default. */
    authModes?: { basic: boolean; magical: boolean };
    /** Identity providers offered for sign-in (the server's oauth_consumer names, e.g. `google`). */
    oauthProviders?: string[];
    recaptchaSiteKey?: string;
    /** Serve only the landing page (pre-launch). */
    landingOnly?: boolean;
  };
  /** Sources the app adds to the framework's Content-Security-Policy, e.g. an analytics host. */
  contentSecurityPolicy?: CspAdditions;
  extensions?: ZephyrexClientExtension[];
  pages?: RouteDefinition[];
  navItems?: NavItemDefinition[];
  pageSlots?: PageSlots;
  overrides?: Record<string, ComponentType>;
}
