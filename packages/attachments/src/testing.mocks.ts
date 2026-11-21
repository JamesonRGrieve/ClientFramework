// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { attachmentHandlers, type AttachmentStore, emptyAttachmentStore } from './attachments.mocks';

/** Renders `ui` signed in under the Zephyrex test app, its requests answered by /v1/asset and /v1/attachment over `store`. */
export function renderAttachments(ui: ReactElement, store: AttachmentStore = emptyAttachmentStore()): RenderResult {
  withSession();
  vi.stubGlobal('fetch', vi.fn(fetchFrom(attachmentHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}
