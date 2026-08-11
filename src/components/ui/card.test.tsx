// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Card>
        content
      </Card>
    );
    expect(container).toBeInTheDocument();
  });
});
