// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ComponentType, ReactNode } from 'react';
import type { NextRequest, NextResponse } from 'next/server';
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

export type MiddlewareHook = (
  req: NextRequest,
) => Promise<{ activated: boolean; response: NextResponse }>;

// --- Auth flow injection ---

export interface AuthFlowInjection {
  /** Component to render after email identification (e.g. OAuth buttons) */
  identifyExtras?: ComponentType;
  /** Component to render after login form (e.g. magic link, webauthn) */
  loginExtras?: ComponentType;
  /** Component to render after registration form */
  registerExtras?: ComponentType;
  /** MFA verification step — renders when server returns verification flags */
  mfaVerify?: ComponentType<{ type: 'totp' | 'email' | 'sms'; onVerified: () => void }>;
  /** MFA setup step — renders when server returns otp_uri */
  mfaSetup?: ComponentType<{ otpUri: string; onComplete: () => void }>;
}

// --- Management page injection ---

export interface ManagementTab {
  id: string;
  label: string;
  component: ComponentType;
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

  // Auth flow injection
  authFlow?: AuthFlowInjection;

  // Management page tabs (/user/manage)
  managementTabs?: ManagementTab[];
}

export interface ZephyrexConfig {
  server: {
    baseUrl: string;
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
    privateRoutes?: string[];
    enableMFA?: boolean;
    enableSubscription?: boolean;
  };
  extensions?: ZephyrexClientExtension[];
  pages?: RouteDefinition[];
  navItems?: NavItemDefinition[];
  pageSlots?: PageSlots;
  overrides?: Record<string, ComponentType>;
}
