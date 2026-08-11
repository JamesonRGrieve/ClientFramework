// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Disclosure, DisclosureTrigger, DisclosureContent } from './disclosure';

describe('Disclosure', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Disclosure>
        content
      </Disclosure>
    );
    expect(container).toBeInTheDocument();
  });
});
