// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';

describe('AlertDialog', () => {
  it('renders without crashing', () => {
    const { container } = render(<AlertDialog>content</AlertDialog>);
    expect(container).toBeInTheDocument();
  });
});
