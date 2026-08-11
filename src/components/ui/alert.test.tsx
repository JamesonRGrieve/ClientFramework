// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Alert>
        content
      </Alert>
    );
    expect(container).toBeInTheDocument();
  });
});
