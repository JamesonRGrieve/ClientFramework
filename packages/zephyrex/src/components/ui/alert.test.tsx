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
});
