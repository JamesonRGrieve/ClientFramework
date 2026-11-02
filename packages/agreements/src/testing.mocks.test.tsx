// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAgreements } from './agreementsApi';
import { renderAgreements } from './testing.mocks';

function AgreementCount(): string {
  return `${String(useAgreements().data?.length ?? -1)} agreements`;
}

describe('renderAgreements', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signed in, answering the agreements routes', async () => {
    const view = renderAgreements(<AgreementCount />);
    expect(await view.findByText('2 agreements')).toBeInTheDocument();
  });
});
