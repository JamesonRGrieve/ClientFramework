// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { STORE_PROVIDERS, storeFixture } from './ecommerce.mocks';
import { fromStore, StoreFilter } from './StoreFilter';

describe('StoreFilter', () => {
  it('offers every store and all of them, answering the chosen one or null', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const view = render(<StoreFilter stores={STORE_PROVIDERS.instances} value={null} onChange={onChange} />);
    await user.selectOptions(view.getByLabelText('Store'), 'Maker shop');
    expect(onChange).toHaveBeenLastCalledWith('shop-1');
    view.rerender(<StoreFilter stores={STORE_PROVIDERS.instances} value='shop-1' onChange={onChange} />);
    await user.selectOptions(view.getByLabelText('Store'), 'All stores');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('keeps the rows from the chosen store, or all of them', () => {
    const { orders } = storeFixture();
    expect(fromStore(orders, 'etsy-1').map(({ id }) => id)).toEqual(['o2']);
    expect(fromStore(orders, null).map(({ id }) => id)).toEqual(['o1', 'o2']);
  });
});
