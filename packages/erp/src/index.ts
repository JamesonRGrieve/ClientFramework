// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's erp extension (zephyrex[erp]): the operator's ERPNext sites'
// DocTypes, as the server's typed models serve them, their documents, and submitting and cancelling.
export { erpExtension } from './extension';
export { ErpPage } from './ErpPage';
export { DocTypePage } from './DocTypePage';
export { DocumentPage } from './DocumentPage';
export { docTypePath, documentPath, ERP_PATH } from './routes';
export {
  createDocument,
  DocTypeSchema,
  DocumentSchema,
  useDocTypes,
  useDocument,
  useDocumentActions,
  useDocuments,
} from './erpApi';
export type { DocType, DocumentActions, DocumentBatch, ErpDocument } from './erpApi';
