// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { attachmentsExtension as registered } from 'zephyrex/extensions';

/** The attachments client extension, for an app's `extensions`: no pages of its own, its pieces go on the app's record pages. */
export const attachmentsExtension: ZephyrexClientExtension = { ...registered };
