// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './input-otp';

describe('InputOTP', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <InputOTP>
        content
      </InputOTP>
    );
    expect(container).toBeInTheDocument();
  });
});
