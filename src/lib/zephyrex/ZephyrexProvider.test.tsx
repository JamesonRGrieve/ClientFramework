// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { createContext, type ReactNode, useContext } from 'react';
import { describe, expect, it } from 'vitest';
import { usePageSlots } from './PageSlots';
import type { ZephyrexClientExtension, ZephyrexConfig } from './types';
import { useZephyrexConfig, ZephyrexProvider } from './ZephyrexProvider';

const Page = (): null => null;
const Slot = (): null => null;
const Flag = createContext('absent');
const FlagProvider = ({ children }: { children: ReactNode }): React.JSX.Element => <Flag value='present'>{children}</Flag>;

const analytics: ZephyrexClientExtension = {
  name: 'analytics',
  pages: [{ path: 'analytics', component: Page }],
  navItems: [{ title: 'Analytics', url: '/analytics' }],
  providers: [FlagProvider],
  pageSlots: { team: [{ position: 'after', component: Slot }] },
};

const config: ZephyrexConfig = {
  server: { baseUrl: 'https://api.example.com' },
  app: { name: 'Test' },
  pages: [{ path: 'about', component: Page }],
  navItems: [{ title: 'About', url: '/about' }],
  pageSlots: { team: [{ position: 'before', component: Slot }] },
  extensions: [analytics],
};

function Probe(): React.JSX.Element {
  const { routes, navItems } = useZephyrexConfig();
  const slots = usePageSlots('team');
  return (
    <dl>
      <dt>routes</dt>
      <dd>{routes.map((route) => route.path).join(',')}</dd>
      <dt>nav</dt>
      <dd>{navItems.map((item) => item.title).join(',')}</dd>
      <dt>slots</dt>
      <dd>{slots.map((slot) => slot.position).join(',')}</dd>
      <dt>provider</dt>
      <dd>{useContext(Flag)}</dd>
    </dl>
  );
}

describe('ZephyrexProvider', () => {
  it('registers extension pages, nav items, providers and page slots after the app’s own', () => {
    const view = render(
      <ZephyrexProvider config={config}>
        <Probe />
      </ZephyrexProvider>,
    );
    const value = (term: string): string | null =>
      view.getByText(term, { selector: 'dt' }).nextElementSibling?.textContent ?? null;
    expect(value('routes')).toBe('about,analytics');
    expect(value('nav')).toBe('About,Analytics');
    expect(value('slots')).toBe('before,after');
    expect(value('provider')).toBe('present');
  });

  it('rejects use outside the provider', () => {
    expect(() => render(<Probe />)).toThrow('useZephyrexConfig must be used within a ZephyrexProvider');
  });
});
