// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tabs>content</Tabs>);
    expect(container).toBeInTheDocument();
  });
});
