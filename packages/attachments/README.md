# @zephyrex/attachments

Pictures and PDFs on any record in a Zephyrex app. Upload a file, attach it to a record in a role
(`primary_image`, `header_image`, `gallery`, `document`…), and show the record's picture with add,
replace and remove for whoever may edit it. It is the client half of the Zephyrex server's
`attachments` extension (`/v1/asset`, `/v1/attachment`).

The server decides who sees what. A file belongs to its uploader until it is attached; once it is
attached, anyone who can view the record can read it, and only someone who can edit the record can
attach to it. The client checks a file's type and size before it is sent, so a refusal shows at
once, and the server checks them again.

## Install

```bash
pnpm add @zephyrex/attachments
```

Peer dependencies: `zephyrex`, `next`, `react`, `swr`, `zod` and `lucide-react`.

## Use

```typescript
import { attachmentsExtension, RecordPicture } from '@zephyrex/attachments';

const config: ZephyrexConfig = { extensions: [attachmentsExtension] };

// On a record's page:
<RecordPicture target={{ type: 'location', id: location.id }} name={location.name} canEdit={canEdit} />;
```

The extension adds no pages or menu entries; its pieces go on the app's own record pages.
`target.type` is the server's name for the record's type (`location` for `LocationModel`).
`RecordPicture` shows the newest attachment in its role (`primary_image` by default) at `size='lg'`,
or as an avatar with the record's initials at `size='sm'`.

`AttachmentGallery` shows a record's files in one role (`gallery` by default): pictures as
thumbnails, other files (PDFs) as links with their sizes, each opening the file. Someone who may
edit the record gets an add button and a remove button on each file. It reads each file's name,
type and size from the record's attachment list (server 939c2c40 or later).

For other uses, `useAttachments(target, role?)` lists a record's attachments, and
`useAttachmentActions(target)` uploads and attaches (`attachFile`), replaces a role's file
(`replaceFile`), attaches an asset already uploaded (`attach`) and removes (`remove`), refreshing
every list of that record's attachments. `FilePicker` is the button they use: it refuses what the
server would, shows the upload's progress and says why a file was not saved.

## Exports

- Extension and components: `attachmentsExtension`, `RecordPicture`, `AttachmentGallery`, `FilePicker`.
- Reads and writes: `useAttachments`, `useAttachmentActions`, `useAssetUpload`.
- Model: `AssetSchema`, `AssetSummarySchema`, `AttachmentSchema`, `fileSize`, `assetContentPath`, `assetName`, `uploadProblem`,
  `isPicture`, `newestIn`, and the server's limits: `ASSET_TYPES`, `MAX_ASSET_BYTES`,
  `MAX_ASSET_NAME`, `ROLE_PATTERN`, `PRIMARY_IMAGE`, `GALLERY`, `ASSET_ENDPOINT`, `ATTACHMENT_ENDPOINT`.

## License

AGPL-3.0-or-later.
