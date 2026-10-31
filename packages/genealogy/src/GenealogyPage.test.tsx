// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GenealogyPage } from './GenealogyPage';
import { FAMILY_TREE } from './options';
import { GenealogyOptionsProvider } from './OptionsProvider';
import { renderGenealogy } from './testing.mocks';

describe('GenealogyPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the people, the kinship lookup and GEDCOM transfer', async () => {
    const view = renderGenealogy(<GenealogyPage />);
    expect(view.getByRole('heading', { level: 1, name: 'Family tree' })).toBeInTheDocument();
    expect(await view.findByRole('list', { name: 'People' })).toBeInTheDocument();
    expect(view.getByText('How are they related?')).toBeInTheDocument();
    expect(view.getByLabelText('Import a GEDCOM file')).toBeInTheDocument();
  });

  it("takes the app's name for the tree, without GEDCOM when the app has none", async () => {
    const view = renderGenealogy(
      <GenealogyOptionsProvider options={{ ...FAMILY_TREE, tree: 'People', lineage: false, gedcom: false }}>
        <GenealogyPage />
      </GenealogyOptionsProvider>,
    );
    expect(view.getByRole('heading', { level: 1, name: 'People' })).toBeInTheDocument();
    expect(await view.findByRole('list', { name: 'People' })).toBeInTheDocument();
    expect(view.queryByLabelText('Import a GEDCOM file')).not.toBeInTheDocument();
  });
});
