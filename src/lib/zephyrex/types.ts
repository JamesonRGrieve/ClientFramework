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

export interface ZephyrexClientExtension {
  name: string;
  displayName?: string;
  description?: string;
  serverExtension?: string;
  pages?: RouteDefinition[];
  navItems?: NavItemDefinition[];
  settingsPanel?: ComponentType;
  middleware?: MiddlewareHook[];
  providers?: ComponentType<{ children: ReactNode }>[];
  pageSlots?: PageSlots;
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
