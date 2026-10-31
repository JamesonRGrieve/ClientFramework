# @zephyrex/genealogy

Genealogy in a Zephyrex app: family trees, relatives, kinship, social ties (partners, friends,
acquaintances, metamours and polycules), and GEDCOM import and export. It is the client half of the
Zephyrex server's `genealogy` extension.

## Install

```bash
pnpm add @zephyrex/genealogy
```

Peer dependencies: `zephyrex`, `@jgrieve/forms`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { genealogyExtension } from '@zephyrex/genealogy';

const config: ZephyrexConfig = { extensions: [genealogyExtension] };
```

It adds these pages, and a **Family Tree** menu entry:

- `/genealogy`: the user's people, a kinship lookup, and GEDCOM import and export.
- `/genealogy/:personId`: one person, with their relatives and other ties, their polycule and
  metamours, their lineage and a kinship lookup.

## Exports

- Extension and pages: `genealogyExtension`, `GenealogyPage`, `PersonPage`, and the paths
  `GENEALOGY_PATH` and `personPath`.
- Components: `PeopleList`, `Lineage`, `KinshipLookup`, `SocialCircle`, `GedcomTransfer`.
- Data: `genealogyApi`, `usePersons`, `useRelationships`, `useLineage`, `useKinship`, `useConnections`,
  `useMetamours`, `useNetwork`, `describeKinship`, `kinshipLabel`, the relationship kinds and each kind's
  discriminators, and the zod schemas and types for each.

## License

AGPL-3.0-or-later
