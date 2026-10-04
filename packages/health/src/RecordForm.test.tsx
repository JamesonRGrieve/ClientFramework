// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { localInput } from './fields';
import { draftProblem, RecordForm } from './RecordForm';
import { mealType, sleepType } from './recordTypes';

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
    expect(view.getByRole('option', { name: 'Breakfast' })).toBeInTheDocument();
    await user.type(view.getByLabelText('Food'), 'T');
    expect(onEdit).toHaveBeenLastCalledWith('food', 'ToastT');
    await user.selectOptions(view.getByLabelText('Meal'), 'dinner');
    expect(onEdit).toHaveBeenLastCalledWith('kind', 'dinner');
    await user.click(view.getByRole('button', { name: 'Record' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
