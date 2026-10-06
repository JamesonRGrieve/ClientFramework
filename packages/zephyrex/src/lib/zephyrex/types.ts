// SPDX-License-Identifier: AGPL-3.0-or-later
import type { SignInAlternative } from '@zephyrex/auth';
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { NextRequest, NextResponse } from 'next/server.js';
import type { CspAdditions } from './contentSecurityPolicy';
import type { PageSlots } from './PageSlots';
import type { Role } from './pages/team/teamModel';

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

// --- Team page injection ---

/** What a section an extension adds below a team's members is told about the team and the viewer. */
export interface TeamSectionProps {
  teamId: string;
  teamName: string;
  /** Whether the viewer is an admin (or higher) of the team. */
  admin: boolean;
  /** Every role the viewer can see. */
  roles: Role[];
  /** The roles the viewer may grant on the team; empty unless they are an admin. */
  assignable: Role[];
}

// --- Auth page injection ---

/** A page an extension adds to the auth pages, at `<authPath><path>`, inside the auth router. */
export interface AuthPageDefinition {
  path: string;
  component: ComponentType;
  /** Only for a signed-in user; the middleware sends anyone else to sign in first. */
  requiresSession?: boolean;
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

  // Sections below a team's members (/team)
  teamSections?: ComponentType<TeamSectionProps>[];

  // Auth pages (<authPath>/…) and the other ways to sign in the welcome page links to. These are
  // in the sign-in flow, before the server can be asked which extensions it runs, so registering
  // the extension is what turns them on.
  authPages?: AuthPageDefinition[];
  signInAlternatives?: SignInAlternative[];
  /** Sign-in modes this extension turns on: `{ magical: true }` for magic links, `{ passkey: true }` for passkeys. */
  authModes?: { magical?: boolean; passkey?: boolean };
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
    /**
     * Password sign-in (`basic`), on by default. Magic-link sign-in is the auth_magic_link
     * extension's: register @zephyrex/auth-magic-link to turn it on.
     */
    authModes?: { basic: boolean };
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
