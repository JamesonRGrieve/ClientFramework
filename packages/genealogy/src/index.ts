// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's genealogy extension (zephyrex[genealogy]): people, the relationships
// between them, ancestor and descendant walks, kinship, and GEDCOM import and export.
export { genealogyExtension } from './extension';
export { GedcomTransfer } from './GedcomTransfer';
export { GenealogyPage } from './GenealogyPage';
export {
  ANCESTRY,
  ANCESTRY_ROLES,
  GEDCOM_ENDPOINT,
  GedcomImportSchema,
  genealogyApi,
  KinshipSchema,
  LineageSchema,
  PARTNERSHIP,
  PARTNERSHIP_KINDS,
  PERSON_ENDPOINT,
  PersonSchema,
  RELATIONSHIP_ENDPOINT,
  RelationshipSchema,
  SIBLING_OF,
  useKinship,
  useLineage,
  usePersons,
  useRelationships,
} from './genealogyApi';
export type {
  GedcomImport,
  Kinship,
  Lineage as LineageWalk,
  LineageDirection,
  Person,
  PersonFields,
  Relationship,
  RelationshipEnd,
  RelationshipFields,
  WalkOptions,
} from './genealogyApi';
export { describeKinship, kinshipLabel } from './kinship';
export { KinshipLookup } from './KinshipLookup';
export { Lineage } from './Lineage';
export { PeopleList } from './PeopleList';
export { PersonPage } from './PersonPage';
export { GENEALOGY_PATH, personPath } from './routes';
