// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from './breadcrumb';

describe('Breadcrumb', () => {
  it('renders without crashing', () => {
    const { container } = render(<Breadcrumb>content</Breadcrumb>);
    expect(container).toBeInTheDocument();
  });
});
