// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { localInput, localInputAt, quickTimes } from './fields';
import { draftProblem, RecordForm } from './RecordForm';
import { checkInType, mealType, sleepType } from './recordTypes';

describe('draftProblem', () => {
  it('checks the fields’ own rules first, then the record’s', () => {
    const night = { bedtime: localInput('2026-09-30T07:00:00Z'), wake_time: localInput('2026-09-29T23:00:00Z') };
    expect(draftProblem(sleepType, { ...night, quality: '101' })).toBe('Quality (0–100) must be between 0 and 100.');
    expect(draftProblem(sleepType, night)).toBe('Waking must come after bedtime, within a day.');
    expect(draftProblem(mealType, mealType.draftOf(null))).toBe('Food is required.');
  });
});

describe('RecordForm', () => {
  it('gives each field its kind of input, and reports each edit by field', async () => {
    const onEdit = vi.fn();
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const view = render(
      <RecordForm
        type={mealType}
        draft={{ ...mealType.draftOf(null), food: 'Toast', calories: '200' }}
        label='New meal'
        onEdit={onEdit}
        onSubmit={onSubmit}
      >
        <button type='submit'>Record</button>
      </RecordForm>,
    );
    expect(view.getByLabelText('When')).toHaveAttribute('type', 'datetime-local');
    expect(view.getByLabelText('Calories')).toHaveAttribute('type', 'number');
    expect(view.getByLabelText('Calories')).toHaveAttribute('max', '20000');
    expect(view.getByRole('radio', { name: 'Breakfast' })).toBeInTheDocument();
    await user.type(view.getByLabelText('Food'), 'T');
    expect(onEdit).toHaveBeenLastCalledWith('food', 'ToastT');
    await user.click(view.getByRole('radio', { name: 'Dinner' }));
    expect(onEdit).toHaveBeenLastCalledWith('kind', 'dinner');
    await user.click(view.getByRole('button', { name: 'Record' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('offers one-tap times beside the picker, and the suggestions before the box', async () => {
    const onEdit = vi.fn<(key: string, value: string) => void>();
    const user = userEvent.setup();
    const view = render(
      <RecordForm
        type={checkInType}
        draft={checkInType.draftOf(null)}
        label='New check-in'
        suggestions={{ about: ['Myself', 'Alex Chen'] }}
        onEdit={onEdit}
        onSubmit={vi.fn()}
      >
        <button type='submit'>Record</button>
      </RecordForm>,
    );
    const times = view.getByRole('group', { name: 'Quick times for When' });
    await user.click(within(times).getByRole('button', { name: 'Yesterday' }));
    const yesterday = onEdit.mock.lastCall?.[1] ?? '';
    const dayAgo = Date.now() - 86_400_000;
    expect(Math.abs(new Date(yesterday).getTime() - dayAgo)).toBeLessThan(120_000);
    const about = view.getByLabelText('About');
    expect(about).toHaveAttribute('placeholder', 'Or type your own');
    const chips = view.getByRole('group', { name: 'Suggestions for About' });
    expect(chips.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('quickTimes', () => {
  it('names now, an hour ago and yesterday, as local input text', () => {
    const now = new Date(2026, 10, 20, 9, 30);
    expect(quickTimes(now)).toEqual([
      ['Now', localInputAt(now)],
      ['An hour ago', localInputAt(new Date(2026, 10, 20, 8, 30))],
      ['Yesterday', localInputAt(new Date(2026, 10, 19, 9, 30))],
    ]);
    expect(localInputAt(now)).toBe('2026-11-20T09:30');
  });
});
