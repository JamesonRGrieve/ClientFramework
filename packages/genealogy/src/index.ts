// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's genealogy extension (zephyrex[genealogy]): people, the relationships
// between them (family, partners, friends, acquaintances), ancestor and descendant walks, kinship,
// social ties (connections, metamours, polycules), and GEDCOM import and export.
export { createGenealogyExtension, genealogyExtension } from './extension';
export { GedcomTransfer } from './GedcomTransfer';
export { GenealogyPage } from './GenealogyPage';
export { type AppTie, FAMILY_TREE, type GenealogyOptions, type PersonPanel } from './options';
export { type CardField, type CardSection, PersonCard } from './PersonCard';
export { GenealogyOptionsProvider, useGenealogyOptions } from './OptionsProvider';
export {
  ACQUAINTANCE,
  ACQUAINTANCE_KINDS,
  ANCESTRY,
  ANCESTRY_ROLES,
  ATTRIBUTE_ENDPOINT,
  AttributeSchema,
  ConnectionsSchema,
  FRIENDSHIP,
  FRIENDSHIP_KINDS,
  GEDCOM_ENDPOINT,
  GedcomImportSchema,
  genealogyApi,
  KinshipSchema,
  LINKED_NETWORK_ENDPOINT,
  LineageSchema,
  LinkedNetworkSchema,
  MENTORSHIP,
  MENTORSHIP_ROLES,
  MetamoursSchema,
  NetworkSchema,
  PARTNERSHIP,
  PARTNERSHIP_KINDS,
  PERSON_ENDPOINT,
  PersonCardSchema,
  personCardPath,
  PersonSchema,
  RELATIONSHIP_ENDPOINT,
  RelationshipSchema,
  SIBLING_KINDS,
  SIBLING_OF,
  SYMMETRIC_KINDS,
  useConnections,
  useKinship,
  useLineage,
  useLinkedNetwork,
  useMetamours,
  useNetwork,
  usePersonCard,
  usePersons,
  useRelationships,
} from './genealogyApi';
export type {
  Attribute,
  AttributeFields,
  CardContents,
  Connections,
  GedcomImport,
  Kinship,
  Lineage as LineageWalk,
  LinkedNetwork,
  LineageDirection,
  Metamours,
  Network,
  NetworkOptions,
  Person,
  PersonFields,
  Relationship,
  RelationshipEnd,
  RelationshipFields,
  SymmetricKind,
  TieOptions,
  WalkOptions,
} from './genealogyApi';
export { describeKinship, kinshipLabel } from './kinship';
export { KinshipLookup } from './KinshipLookup';
export { Lineage } from './Lineage';
export { byGroup, LinkedNetworkMap } from './LinkedNetworkMap';
export { type LegendEntry, TIE_LEGEND } from './legend';
export { NetworkGraph } from './NetworkGraph';
export { fromLinkedNetwork, fromNetwork, socialLayout } from './socialLayout';
export type { GraphInput, GraphPerson, GraphTie } from './socialLayout';
export { PeopleList } from './PeopleList';
export { PersonPage } from './PersonPage';
export { SocialCircle } from './SocialCircle';
export { GENEALOGY_PATH, personPath } from './routes';
