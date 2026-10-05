// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Problem } from './Problem';

describe('Problem', () => {
  it('announces what went wrong, and shows nothing when nothing did', () => {
    const view = render(<Problem text='It broke.' />);
    expect(view.getByRole('alert')).toHaveTextContent('It broke.');
    view.rerender(<Problem text={null} />);
    expect(view.queryByRole('alert')).toBeNull();
  });
});
