// SPDX-License-Identifier: AGPL-3.0-or-later
// Where the ERP pages mount in the app (the extension's routes and links): a DocType by the
// catalogue's namespace and slug, a document by its name.
import type { DocType } from './erpApi';

export const ERP_PATH = '/erp';

export const docTypePath = ({ namespace, slug }: Pick<DocType, 'namespace' | 'slug'>): string =>
  `${ERP_PATH}/${encodeURIComponent(namespace)}/${encodeURIComponent(slug)}`;

export const documentPath = (docType: Pick<DocType, 'namespace' | 'slug'>, name: string): string =>
  `${docTypePath(docType)}/${encodeURIComponent(name)}`;
