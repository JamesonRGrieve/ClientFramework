// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/genealogy', () => {
  it('publishes the pages, their sections, the API and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'ANCESTRY',
        'ANCESTRY_ROLES',
        'GEDCOM_ENDPOINT',
        'GENEALOGY_PATH',
        'GedcomImportSchema',
        'GedcomTransfer',
        'GenealogyPage',
        'KinshipLookup',
        'KinshipSchema',
        'Lineage',
        'LineageSchema',
        'PARTNERSHIP',
        'PARTNERSHIP_KINDS',
        'PERSON_ENDPOINT',
        'PeopleList',
        'PersonPage',
        'PersonSchema',
        'RELATIONSHIP_ENDPOINT',
        'RelationshipSchema',
        'SIBLING_OF',
        'describeKinship',
        'genealogyApi',
        'genealogyExtension',
        'kinshipLabel',
        'personPath',
        'useKinship',
        'useLineage',
        'usePersons',
        'useRelationships',
      ].sort(),
    );
  });
});
