// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { lazy } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_ROLE_ID } from './hooks';
import { managementAnchor, ManagementSections, visibleTabs } from './ManagementTabRegistry';
import type { ManagementTab, ZephyrexClientExtension } from './types';
import { TestWrapper, testConfig } from '@/__tests__/test-wrapper';

const HTTP_OK = 200;
const Plain = (): React.JSX.Element => <p>everyone</p>;
const AdminOnly = (): React.JSX.Element => <p>admins</p>;
const Owner = (): React.JSX.Element => <p>owners</p>;

const tabs: ManagementTab[] = [
  { id: 'plain', label: 'Plain', component: Plain },
  { id: 'admin', label: 'Admin', component: AdminOnly, requireRole: 'admin' },
  { id: 'owner', label: 'Owner', component: Owner, requireRole: 'superadmin' },
];

describe('visibleTabs', () => {
  it('shows role-free tabs to everyone and gated tabs only to that role', () => {
    const ids = (role: Parameters<typeof visibleTabs>[1]): string[] => visibleTabs(tabs, role).map((tab) => tab.id);
    expect(ids({ isAdmin: false, isSuperAdmin: false, roleId: null })).toEqual(['plain']);
    expect(ids({ isAdmin: true, isSuperAdmin: false, roleId: ADMIN_ROLE_ID })).toEqual(['plain', 'admin']);
    expect(ids({ isAdmin: true, isSuperAdmin: true, roleId: null })).toEqual(['plain', 'admin', 'owner']);
  });

  it('anchors each tab for linking', () => {
    expect(managementAnchor({ id: 'plain', label: 'Plain', component: Plain })).toBe('manage-plain');
  });
});

describe('ManagementSections', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'zx_csrf=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  // The account page is for a signed-in user: the server is asked for its extensions only then.
  const serveExtensions = (names: string[]): void => {
    document.cookie = 'zx_csrf=csrf-1; path=/';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              url === `${testConfig.server.baseUrl}/v1/extension`
                ? { extensions: names.map((name) => ({ id: name, name })) }
                : {},
            ),
            { status: HTTP_OK },
          ),
        ),
      ),
    );
  };

  const extension = (name: string, managementTabs: ManagementTab[]): ZephyrexClientExtension => ({
    name,
    serverExtension: name,
    managementTabs,
  });

  it('renders the sections of extensions the server has loaded, lazily and in priority order', async () => {
    serveExtensions(['auth_mfa', 'quota']);
    const Lazy = lazy(async () => Promise.resolve({ default: (): React.JSX.Element => <p>two-factor</p> }));
    const view = render(
      <TestWrapper
        config={{
          extensions: [
            extension('quota', [{ id: 'usage', label: 'Usage', component: Plain, priority: 45 }]),
            extension('auth_mfa', [{ id: 'mfa', label: 'Two-factor authentication', component: Lazy, priority: 20 }]),
            extension('not_loaded', [{ id: 'ghost', label: 'Ghost', component: Owner }]),
          ],
        }}
      >
        <ManagementSections />
      </TestWrapper>,
    );
    expect(await view.findByText('two-factor')).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(view.queryByRole('region', { name: 'Ghost' })).not.toBeInTheDocument();
    });
    const regions = [...view.container.querySelectorAll('section')].map((section) => [
      section.id,
      section.getAttribute('aria-label'),
    ]);
    expect(regions).toEqual([
      ['manage-mfa', 'Two-factor authentication'],
      ['manage-usage', 'Usage'],
    ]);
  });

  it('hides a tab that needs a role the user lacks', async () => {
    serveExtensions(['admin_tools']);
    const view = render(
      <TestWrapper
        config={{
          extensions: [
            extension('admin_tools', [
              { id: 'a', label: 'Admin', component: AdminOnly, requireRole: 'admin' },
              { id: 'p', label: 'Plain', component: Plain },
            ]),
          ],
        }}
      >
        <ManagementSections />
      </TestWrapper>,
    );
    expect(await view.findByText('everyone')).toBeInTheDocument();
    expect(view.queryByText('admins')).not.toBeInTheDocument();
  });
});
