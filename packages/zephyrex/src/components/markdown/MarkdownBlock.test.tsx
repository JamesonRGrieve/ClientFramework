// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MarkdownBlock, * as mod from './MarkdownBlock';

const CODE = '```\nhello\n```';
const FIRST_SHOWN_MS = 1_000;
const LATER_MS = 2_000;

const downloadName = (): string | null => screen.getByRole('button', { name: /^Download / }).getAttribute('aria-label');

describe('MarkdownBlock', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('module exports', () => {
    expect(mod).toBeDefined();
  });

  it('names code downloads after the message role and time', () => {
    render(<MarkdownBlock content={CODE} role='assistant' createdAt='2026-09-30 12:00:00.123' />);
    expect(downloadName()).toBe('Download assistant-2026-09-30-12-00-00.txt');
  });

  it('names code downloads after when the message was first shown when it has no time', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(FIRST_SHOWN_MS);
    const { rerender } = render(<MarkdownBlock content={CODE} role='user' />);
    expect(downloadName()).toBe(`Download user-${FIRST_SHOWN_MS}.txt`);

    now.mockReturnValue(LATER_MS);
    rerender(<MarkdownBlock content={CODE} role='user' />);
    expect(downloadName()).toBe(`Download user-${FIRST_SHOWN_MS}.txt`);
  });
});
