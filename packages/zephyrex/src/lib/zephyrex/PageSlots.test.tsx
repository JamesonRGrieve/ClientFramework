// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { SidebarContentProvider, useSidebarContent } from '../../components/appwrapper/src/SidebarContentManager';
import { type PageSlots, PageSlotsProvider, PageWithSlots } from './PageSlots';

const Labelled = (label: string): ComponentType => {
  const Component = (): React.JSX.Element => <p>{label}</p>;
  Component.displayName = `Labelled(${label})`;
  return Component;
};

function SidebarProbe(): React.JSX.Element {
  const { content, title } = useSidebarContent();
  return <aside aria-label={title ?? ''}>{content}</aside>;
}

const renderPage = (slots: PageSlots, content: ReactNode): ReturnType<typeof render> =>
  render(
    <SidebarContentProvider>
      <PageSlotsProvider slots={slots}>{content}</PageSlotsProvider>
      <SidebarProbe />
    </SidebarContentProvider>,
  );

const page = within(document.body);
const texts = (): string[] => page.getAllByRole('paragraph').map((node) => node.textContent);

describe('PageWithSlots', () => {
  it('renders the page alone when no extension injects into it', () => {
    renderPage(
      {},
      <PageWithSlots name='team'>
        <p>page</p>
      </PageWithSlots>,
    );
    expect(texts()).toEqual(['page']);
  });

  it('places before/after slots around the page, lowest priority first', () => {
    const slots: PageSlots = {
      team: [
        { position: 'after', component: Labelled('after-late'), priority: 90 },
        { position: 'before', component: Labelled('before') },
        { position: 'after', component: Labelled('after-early'), priority: 10 },
      ],
      settings: [{ position: 'before', component: Labelled('other page') }],
    };
    renderPage(
      slots,
      <PageWithSlots name='team'>
        <p>page</p>
      </PageWithSlots>,
    );
    expect(texts()).toEqual(['before', 'page', 'after-early', 'after-late']);
  });

  it('does not reorder the shared slot registry', () => {
    const team = [
      { position: 'after' as const, component: Labelled('b'), priority: 90 },
      { position: 'after' as const, component: Labelled('a'), priority: 10 },
    ];
    renderPage(
      { team },
      <PageWithSlots name='team'>
        <p>page</p>
      </PageWithSlots>,
    );
    expect(team.map((slot) => slot.priority)).toEqual([90, 10]);
  });

  it('lets a replace slot stand in for the whole page', () => {
    renderPage(
      {
        team: [
          { position: 'replace', component: Labelled('replacement') },
          { position: 'before', component: Labelled('before') },
        ],
      },
      <PageWithSlots name='team'>
        <p>page</p>
      </PageWithSlots>,
    );
    expect(texts()).toEqual(['replacement']);
  });

  it('composes sidebar slots after the page’s own sidebar content', () => {
    renderPage(
      { team: [{ position: 'sidebar', component: Labelled('stats') }] },
      <PageWithSlots name='team' sidebar={<p>details</p>} sidebarTitle='Team Details'>
        <p>page</p>
      </PageWithSlots>,
    );
    const sidebar = page.getByRole('complementary', { name: 'Team Details' });
    expect([...sidebar.querySelectorAll('p')].map((node) => node.textContent)).toEqual(['details', 'stats']);
  });

  it('passes pageProps to every injected component', () => {
    const ShowsProps = ({ pageProps }: { pageProps?: Record<string, unknown> | undefined }): React.JSX.Element => (
      <p>{String(pageProps?.['teamId'])}</p>
    );
    renderPage(
      { team: [{ position: 'after', component: ShowsProps }] },
      <PageWithSlots name='team' pageProps={{ teamId: 't1' }}>
        <p>page</p>
      </PageWithSlots>,
    );
    expect(texts()).toEqual(['page', 't1']);
  });
});
