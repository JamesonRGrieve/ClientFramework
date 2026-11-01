// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyRotaStore } from './rota.mocks';
import { useMyRotas } from './rotaApi';
import { renderRota } from './testing.mocks';

function RotaCount(): string {
  return `${String(useMyRotas().data?.length ?? 0)} rotas`;
}

describe('renderRota', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signed in, answering the rota routes from the given store', async () => {
    const view = renderRota(<RotaCount />);
    expect(await view.findByText('1 rotas')).toBeInTheDocument();
  });

  it('serves nothing from an empty store', async () => {
    const view = renderRota(<RotaCount />, emptyRotaStore());
    expect(await view.findByText('0 rotas')).toBeInTheDocument();
  });
});
