// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { FAMILY_TREE } from './options';
import { GenealogyOptionsProvider, useGenealogyOptions } from './OptionsProvider';

function TreeName(): ReactElement {
  const options = useGenealogyOptions();
  return <p>{`${options.tree}, lineage ${options.lineage ? 'on' : 'off'}`}</p>;
}

describe('GenealogyOptionsProvider', () => {
  it('falls back to the family tree with no provider', () => {
    const view = render(<TreeName />);
    expect(view.getByText('Family tree, lineage on')).toBeInTheDocument();
  });

  it("gives the pages under it the app's options", () => {
    const view = render(
      <GenealogyOptionsProvider options={{ ...FAMILY_TREE, tree: 'People', lineage: false }}>
        <TreeName />
      </GenealogyOptionsProvider>,
    );
    expect(view.getByText('People, lineage off')).toBeInTheDocument();
  });
});
