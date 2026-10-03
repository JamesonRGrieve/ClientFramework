// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type ConflictField, ConflictPanel, displayValue } from './ConflictPanel';

interface Team {
  name: string;
  description: string | null;
  updated_at: string;
}

const MINE = 'Platform team';
const SAVE_MERGED = 'Save merged';
const THEIR_DESCRIPTION = 'Runs the build fleet';
const theirs: Team = { name: 'Platform', description: THEIR_DESCRIPTION, updated_at: '2026-10-03T18:00:00.000001' };
const fields: readonly ConflictField<Team>[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
];

const renderPanel = (
  mine: Partial<Team>,
  current: Team | null,
  applyLabel?: string,
): { onResolve: ReturnType<typeof vi.fn>; onDiscard: ReturnType<typeof vi.fn> } => {
  const onResolve = vi.fn();
  const onDiscard = vi.fn();
  render(
    <ConflictPanel<Team>
      conflict={{ mine, theirs: current }}
      fields={applyLabel === undefined ? fields : []}
      onResolve={onResolve}
      onDiscard={onDiscard}
      applyLabel={applyLabel}
    />,
  );
  return { onResolve, onDiscard };
};

describe('ConflictPanel', () => {
  it("sets each changed field beside the current value, keeping the user's by default", async () => {
    const { onResolve } = renderPanel({ name: MINE, description: null }, theirs);
    expect(screen.getByRole('radio', { name: `Yours: ${MINE}` })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Current: Platform' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Yours: (empty)' })).toBeChecked();
    expect(screen.getByRole('radio', { name: `Current: ${THEIR_DESCRIPTION}` })).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: SAVE_MERGED }));
    expect(onResolve).toHaveBeenCalledWith({ name: MINE, description: null });
  });

  it('takes the current value for the fields the user picks it for', async () => {
    const { onResolve } = renderPanel({ name: MINE, description: null }, theirs);
    await userEvent.click(screen.getByRole('radio', { name: `Current: ${THEIR_DESCRIPTION}` }));
    await userEvent.click(screen.getByRole('button', { name: SAVE_MERGED }));
    expect(onResolve).toHaveBeenCalledWith({ name: MINE, description: THEIR_DESCRIPTION });
  });

  it('shows a value as the field formats it', () => {
    const named = new Map([['r-admin', 'Admin']]);
    render(
      <ConflictPanel<Team>
        conflict={{ mine: { name: 'r-admin' }, theirs: { ...theirs, name: 'r-user' } }}
        fields={[{ key: 'name', label: 'Role', format: ({ name }) => named.get(name ?? '') ?? 'another role' }]}
        onResolve={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Yours: Admin' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Current: another role' })).toBeInTheDocument();
  });

  it('only compares the fields the user changed', () => {
    renderPanel({ name: MINE }, theirs);
    expect(screen.getByRole('group', { name: 'Name' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Description' })).not.toBeInTheDocument();
  });

  it('offers to go ahead with a change that has no fields to compare', async () => {
    const { onResolve } = renderPanel({}, theirs, 'Revoke anyway');
    await userEvent.click(screen.getByRole('button', { name: 'Revoke anyway' }));
    expect(onResolve).toHaveBeenCalledWith({});
  });

  it('only offers to discard when the server did not send the row as it is now', async () => {
    const { onDiscard } = renderPanel({ name: MINE }, null);
    expect(screen.getByText(/may have been removed/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SAVE_MERGED })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Discard my changes' }));
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});

describe('displayValue', () => {
  it('shows strings as written, empties as empty, anything else as JSON', () => {
    expect(displayValue('Alpha')).toBe('Alpha');
    expect(displayValue(null)).toBe('(empty)');
    expect(displayValue(undefined)).toBe('(empty)');
    expect(displayValue('')).toBe('(empty)');
    expect(displayValue(3)).toBe('3');
    expect(displayValue({ a: [1] })).toBe('{"a":[1]}');
  });
});
