// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ZephyrexConfig } from './types';
import { ZephyrexProvider } from './ZephyrexProvider';
import { matchRoute, ZephyrexRouter } from './ZephyrexRouter';

describe('matchRoute', () => {
  it('matches literal and :named / [named] segments', () => {
    expect(matchRoute('team/:id/settings', ['team', 't1', 'settings'])).toEqual({ id: 't1' });
    expect(matchRoute('team/[id]', ['team', 't1'])).toEqual({ id: 't1' });
    expect(matchRoute('about', ['about'])).toEqual({});
  });

  it('rejects differing literals or lengths', () => {
    expect(matchRoute('team/:id', ['teams', 't1'])).toBeNull();
    expect(matchRoute('team/:id', ['team'])).toBeNull();
  });
});

const ShowParams = ({ params }: { params: Record<string, unknown> }): React.JSX.Element => <p>{String(params['slug'])}</p>;

const config: ZephyrexConfig = {
  server: { baseUrl: 'https://api.example.com' },
  app: { name: 'Test' },
  extensions: [{ name: 'analytics', pages: [{ path: 'analytics/:report', component: ShowParams }] }],
};

const route = (slug: string[]): ReturnType<typeof render> =>
  render(
    <ZephyrexProvider config={config}>
      <ZephyrexRouter params={{ slug }} searchParams={{}} />
    </ZephyrexProvider>,
  );

describe('ZephyrexRouter', () => {
  it('renders the extension page whose pattern matches the slug', () => {
    const view = route(['analytics', 'weekly']);
    expect(view.getByText('analytics/weekly')).toBeInTheDocument();
  });

  it('passes named segments to the page', () => {
    const ShowReport = ({ params }: { params: Record<string, unknown> }): React.JSX.Element => (
      <p>{`report=${String(params['report'])}`}</p>
    );
    const view = render(
      <ZephyrexProvider
        config={{ ...config, extensions: [{ name: 'a', pages: [{ path: 'analytics/:report', component: ShowReport }] }] }}
      >
        <ZephyrexRouter params={{ slug: ['analytics', 'weekly'] }} searchParams={{}} />
      </ZephyrexProvider>,
    );
    expect(view.getByText('report=weekly')).toBeInTheDocument();
  });

  it('hands unmatched paths to the not-found page', () => {
    expect(() => route(['analytics'])).toThrow('NEXT_NOT_FOUND');
    expect(() => route(['nothing', 'here'])).toThrow('NEXT_NOT_FOUND');
  });
});
