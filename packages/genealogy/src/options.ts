// SPDX-License-Identifier: AGPL-3.0-or-later
// No 'use client': an app's config (read on the server, by its proxy too) builds the extension from these.
import type { ComponentType } from 'react';
import type { Person } from './genealogyApi';
import { type LegendEntry, TIE_LEGEND } from './legend';

/**
 * A directed kind of tie an app adds (registered with the server's genealogy), offered on a
 * person's page from both ends. The tie's subject is its `person_id`: for a power-exchange dynamic,
 * the dominant side, so the relative of someone who is the subject is their "Sub".
 */
export interface AppTie {
  kind: string;
  /** What the relative is called when the person is the subject (the relative being the object). */
  objectRelative: string;
  /** What the relative is called when the person is the object (the relative being the subject). */
  subjectRelative: string;
  /** The subkinds the server accepts for it (its discriminators), in the order to offer them. */
  details: readonly string[];
  /** The label over the subkind choice, e.g. "Dynamic". */
  detailLabel: string;
}

/** A section an app adds to a person's page, named so the page can tell its panels apart. */
export interface PersonPanel {
  name: string;
  component: ComponentType<{ person: Person }>;
}

/**
 * How an app frames its tree: what it calls it, which genealogy sections it shows, and which ties
 * a person's circle walks. A family history app has a "Family tree" with lineage and GEDCOM; a
 * social app has "People" without them, walking the kinds of tie it adds.
 */
export interface GenealogyOptions {
  /** The tree's name, in headings and the way back to it. */
  tree: string;
  /** Ancestors, descendants and kinship: the family history sections. */
  lineage: boolean;
  /** GEDCOM import and export on the overview. */
  gedcom: boolean;
  /** The kinds of tie a person's circle walks (friendships are added when asked). */
  circleKinds: readonly string[];
  /** What the graph's legend calls each kind of tie, including any the app adds. */
  legend: readonly LegendEntry[];
  /** Directed kinds of tie the app adds, which a person's page offers beside the framework's. */
  ties?: readonly AppTie[];
  /** What the app adds to a person's page, after their details (e.g. its card), in order, each named uniquely. */
  panels?: readonly PersonPanel[];
}

export const FAMILY_TREE: GenealogyOptions = {
  tree: 'Family tree',
  lineage: true,
  gedcom: true,
  circleKinds: ['partnership'],
  legend: TIE_LEGEND,
};
