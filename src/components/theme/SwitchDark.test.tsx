// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SwitchDark from './SwitchDark';

describe('SwitchDark', () => {
  it('renders without crashing', () => {
    const { container } = render(<SwitchDark />);
    expect(container).toBeInTheDocument();
  });
});
