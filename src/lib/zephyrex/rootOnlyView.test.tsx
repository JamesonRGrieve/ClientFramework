// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { rootOnlyView } from './rootOnlyView';

const HTTP_FORBIDDEN = 403;
const HTTP_SERVER_ERROR = 500;
const SUBJECT = 'widget status';

const fallbackText = (view: ReturnType<typeof rootOnlyView>): string | null =>
  view.fallback === null ? null : render(view.fallback).container.textContent;

describe('rootOnlyView', () => {
  it('says the view is root only when the server refuses', () => {
    const view = rootOnlyView({ data: undefined, error: new ApiError(HTTP_FORBIDDEN, 'Root only') }, SUBJECT);
    expect(fallbackText(view)).toBe(`Only the root user can view ${SUBJECT}.`);
  });

  it('says loading failed on any other error', () => {
    const view = rootOnlyView({ data: undefined, error: new ApiError(HTTP_SERVER_ERROR, 'boom') }, SUBJECT);
    expect(fallbackText(view)).toBe(`Failed to load ${SUBJECT}.`);
  });

  it('says it is loading until there is data', () => {
    expect(fallbackText(rootOnlyView({ data: undefined, error: undefined }, SUBJECT))).toBe('Loading…');
  });

  it('hands over the data once it has loaded', () => {
    expect(rootOnlyView({ data: { ready: true }, error: undefined }, SUBJECT)).toEqual({
      data: { ready: true },
      fallback: null,
    });
  });
});
