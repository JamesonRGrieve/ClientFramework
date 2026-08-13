// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './drawer';

describe('Drawer', () => {
  it('renders without crashing', () => {
    const { container } = render(<Drawer>content</Drawer>);
    expect(container).toBeInTheDocument();
  });
});
