import type { ComponentType, ReactNode } from 'react';
import type { NextRequest, NextResponse } from 'next/server';

export type SlotId =
  | 'nav.footer'
  | 'nav.primary.append'
  | 'settings.tabs'
  | 'user-menu.items'
  | 'header.right'
  | 'app.body.append';

export interface ExtensionNavSubItem {
  title: string;
  url: string;
  icon?: ComponentType<{ className?: string }>;
  order?: number;
  max_role?: number;
  queryParams?: Record<string, string>;
}

export interface ExtensionNavItem {
  title: string;
  url?: string;
  icon?: ComponentType<{ className?: string }>;
  order?: number;
  visible?: boolean;
  queryParams?: Record<string, string>;
  items?: ExtensionNavSubItem[];
}

export interface ExtensionSlotContribution {
  id: SlotId | (string & {});
  render: ComponentType;
  order?: number;
}

export type ExtensionProvider = ComponentType<{ children: ReactNode }>;

export interface ExtensionMiddlewareResult {
  activated: boolean;
  response: NextResponse;
}

export type ExtensionMiddleware = (req: NextRequest) => Promise<ExtensionMiddlewareResult>;

export interface ExtensionManifest {
  readonly id: string;
  readonly version?: string;
  readonly providers?: ReadonlyArray<ExtensionProvider>;
  readonly nav?: ReadonlyArray<ExtensionNavItem>;
  readonly slots?: ReadonlyArray<ExtensionSlotContribution>;
}
