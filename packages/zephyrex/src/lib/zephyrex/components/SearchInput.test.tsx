// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

// SearchInput is a pure UI component — no providers needed, no mocks needed.
describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput onSearch={vi.fn()} placeholder='Find users' />);
    expect(screen.getByPlaceholderText('Find users')).toBeInTheDocument();
  });

  it('calls onSearch after typing', async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={0} />);
    await userEvent.type(screen.getByRole('searchbox'), 'test');
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('test'));
  });

  it('shows clear button when value present', async () => {
    render(<SearchInput onSearch={vi.fn()} debounceMs={0} />);
    await userEvent.type(screen.getByRole('searchbox'), 'abc');
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clear button resets value and calls onClear', async () => {
    const onSearch = vi.fn();
    const onClear = vi.fn();
    render(<SearchInput onSearch={onSearch} onClear={onClear} debounceMs={0} />);
    await userEvent.type(screen.getByRole('searchbox'), 'abc');
    await userEvent.click(screen.getByLabelText('Clear search'));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(onClear).toHaveBeenCalledOnce();
  });
});
