# @zephyrex/erp

The operator's ERPNext sites in a Zephyrex app: each site's DocTypes, their documents, and creating,
editing, deleting, submitting and cancelling them, live on the site. It is the client half of the
Zephyrex server's `erp` extension. It reads the DocTypes from the server's federated catalogue and
builds each form from that DocType's typed record and write schemas.

## Install

```bash
pnpm add @zephyrex/erp
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { erpExtension } from '@zephyrex/erp';

const config: ZephyrexConfig = { extensions: [erpExtension] };
```

It adds these pages, and an **ERP** menu entry:

- `/erp`: the DocTypes of each site.
- `/erp/:namespace/:slug`: a DocType's documents, and a form to create one.
- `/erp/:namespace/:slug/:name`: one document. It can be edited, deleted, submitted or cancelled.

Every write sends the version it was based on (`If-Match`). If someone changed the document in the
meantime, a conflict panel shows both versions before anything is overwritten.

## Exports

- Extension and pages: `erpExtension`, `ErpPage`, `DocTypePage`, `DocumentPage`, and the paths
  `ERP_PATH`, `docTypePath` and `documentPath`.
- Data: `useDocTypes`, `useDocuments`, `useDocument`, `useDocumentActions`, `createDocument`, plus the
  schemas `DocTypeSchema` and `DocumentSchema` and the types `DocType`, `ErpDocument`, `DocumentBatch`
  and `DocumentActions`.

## License

AGPL-3.0-or-later
