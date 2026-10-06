// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { erpFixture } from './erp.mocks';
import { useDocTypes } from './erpApi';
import { recordCalls, renderErp, rowsOf } from './testing.mocks';

const BASE = 'http://localhost:1996';

function DocTypeCount(): string {
  return `${String(useDocTypes().data?.length ?? 0)} types`;
}

describe('the test helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('render under the Zephyrex test app, answering the ERP routes from the store given', async () => {
    expect(await renderErp(<DocTypeCount />).findByText('2 types')).toBeInTheDocument();
  });

  it('record each call answered from the store', async () => {
    const calls = recordCalls(erpFixture());
    await fetch(`${BASE}/v1/federated/catalogue`);
    expect(calls.map(({ url }) => url)).toEqual([`${BASE}/v1/federated/catalogue`]);
  });

  it('read a table’s rows, and name a field that isn’t a table as a mistake', () => {
    expect(rowsOf({ items: [{ code: 'A' }] }, 'items')).toEqual([{ code: 'A' }]);
    expect(() => rowsOf({ name: 'x' }, 'name')).toThrow('name is not a table');
  });
});
