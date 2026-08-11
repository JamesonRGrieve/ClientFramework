// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

describe('Avatar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Avatar>
        content
      </Avatar>
    );
    expect(container).toBeInTheDocument();
  });
});
