// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { erpExtension as registered } from 'zephyrex/extensions';
import { DocTypePage } from './DocTypePage';
import { DocumentPage } from './DocumentPage';
import { ErpPage } from './ErpPage';
import { ERP_PATH } from './routes';

/** The ERP client extension with its pages and menu entry, for an app's `extensions`. */
export const erpExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: ERP_PATH, component: ErpPage },
    { path: `${ERP_PATH}/:namespace/:slug`, component: DocTypePage },
    { path: `${ERP_PATH}/:namespace/:slug/:name`, component: DocumentPage },
  ],
  navItems: [{ title: 'ERP', url: ERP_PATH }],
};
