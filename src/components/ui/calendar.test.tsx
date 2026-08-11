// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Calendar } from './calendar';

describe('Calendar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Calendar>
        content
      </Calendar>
    );
    expect(container).toBeInTheDocument();
  });
});
