// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert, AlertDescription, AlertTitle } from './alert';

describe('Alert', () => {
  it('announces its title and description, and adds no heading to the page outline', () => {
    render(
      <Alert>
        <AlertTitle>Your gift list could not be loaded.</AlertTitle>
        <AlertDescription>Server unavailable</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Your gift list could not be loaded.Server unavailable');
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('gives a title that wraps room between its lines', () => {
    render(<AlertTitle>Your recipes could not be loaded.</AlertTitle>);
    // leading-none made a title wrapped on a phone touch its own second line.
    const title = screen.getByText('Your recipes could not be loaded.');
    expect(title).toHaveClass('leading-snug');
    expect(title).not.toHaveClass('leading-none');
  });
});
