// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { PUBLICATIONS, socialHandlers } from './social.mocks';
import type { SocialPublication } from './socialApi';

/** Renders `ui` under the Zephyrex test app, its requests answered by the social routes over `publications`. */
export function renderSocial(ui: ReactElement, publications: readonly SocialPublication[] = PUBLICATIONS): RenderResult {
  vi.stubGlobal('fetch', vi.fn(fetchFrom(socialHandlers(publications))));
  return render(createElement(TestWrapper, null, ui));
}
