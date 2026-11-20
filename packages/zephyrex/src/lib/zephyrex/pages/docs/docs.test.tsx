// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiReferencePage } from './ApiReferencePage';
import { PrivacyPage } from './PrivacyPage';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

describe('ApiReferencePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('links to the server’s REST reference when it publishes one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    const view = render(
      <TestWrapper>
        <ApiReferencePage />
      </TestWrapper>,
    );
    expect(view.getByRole('heading', { level: 1, name: 'API reference' })).toBeInTheDocument();
    expect(await view.findByRole('link', { name: 'REST API Documentation' })).toHaveAttribute(
      'href',
      `${testConfig.server.baseUrl}/redoc`,
    );
  });

  it('says so, and links nowhere, when the server keeps its reference private', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    const view = render(
      <TestWrapper>
        <ApiReferencePage />
      </TestWrapper>,
    );
    expect(await view.findByText('This server doesn’t publish its REST reference.')).toBeInTheDocument();
    expect(view.queryByRole('link', { name: 'REST API Documentation' })).toBeNull();
  });
});

describe('PrivacyPage', () => {
  it('renders the policy Markdown the app passes in', () => {
    const view = render(
      <TestWrapper>
        <PrivacyPage content={'# Our Policy\n\nWe keep what we need.'} />
      </TestWrapper>,
    );
    expect(view.getByRole('heading', { name: 'Our Policy' })).toBeInTheDocument();
    expect(view.getByText('We keep what we need.')).toBeInTheDocument();
  });
});
