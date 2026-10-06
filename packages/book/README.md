# @zephyrex/book

Books in a Zephyrex app: the user's books and their chapters, written and downloaded as Markdown,
HTML or EPUB. It is the client half of the Zephyrex server's `book` extension.

## Install

```bash
pnpm add @zephyrex/book
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { bookExtension } from '@zephyrex/book';

const config: ZephyrexConfig = { extensions: [bookExtension] };
```

It adds these pages, and a **Books** menu entry:

- `/book`: the user's books.
- `/book/:bookId`: one book, with its details and its chapters.

## Exports

- Extension and pages: `bookExtension`, `BooksPage`, `BookPage`, and the paths `BOOK_PATH` and
  `bookPagePath`.
- Books: `useBooks`, `useBook`, `useBookActions`, `createBook`, `exportUrl`, `EXPORT_FORMATS` and
  `BOOK_STATUSES`.
- Chapters: `useChapters`, `useChapterActions`, `createChapter`.
- The zod schemas and types for each.

## License

AGPL-3.0-or-later
