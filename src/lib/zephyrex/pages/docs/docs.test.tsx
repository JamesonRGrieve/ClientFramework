// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiReferencePage } from './ApiReferencePage';
import { PrivacyPage } from './PrivacyPage';
import { TestWrapper, testConfig } from '@/__tests__/test-wrapper';

describe('ApiReferencePage', () => {
  it('links to the configured server’s REST reference', () => {
    const view = render(
      <TestWrapper>
        <ApiReferencePage />
      </TestWrapper>,
    );
    expect(view.getByRole('link', { name: 'REST API Documentation' })).toHaveAttribute(
      'href',
      `${testConfig.server.baseUrl}/redoc`,
    );
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
