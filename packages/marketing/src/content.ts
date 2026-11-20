// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The copy a landing page is built from. The components hold no words of their own beyond
 * accessible defaults; each app passes its own content, so the text stays in the app.
 */

/** Where a feature works: in every edition, or only on the hosted service. */
export type Availability = 'everywhere' | 'hosted';

export interface Feature {
  id: string;
  title: string;
  summary: string;
  details: readonly string[];
  availability: Availability;
}

export interface Link {
  label: string;
  href: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  includes: readonly string[];
  cta: Link;
  highlighted?: boolean;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface FooterColumn {
  title: string;
  links: readonly Link[];
}
