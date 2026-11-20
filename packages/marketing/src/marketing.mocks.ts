// SPDX-License-Identifier: AGPL-3.0-or-later
/** Sample landing copy for the package's own tests and stories (kept out of dist). */
import type { Faq, Feature, FooterColumn, Link, Plan } from './content';

export const FEATURE_EVERYWHERE: Feature = {
  id: 'offline',
  title: 'Works offline',
  summary: 'Everything runs on your own machine.',
  details: ['No account', 'Your data stays with you'],
  availability: 'everywhere',
};

export const FEATURE_HOSTED: Feature = {
  id: 'sync',
  title: 'Sync across devices',
  summary: 'Pick up where you left off on any device.',
  details: ['Sign in with a link', 'Encrypted at rest'],
  availability: 'hosted',
};

export const PLAN_FREE: Plan = {
  id: 'free',
  name: 'Free',
  price: '$0',
  cadence: 'forever',
  blurb: 'Everything for one person.',
  includes: ['Every core feature', 'Self-hosted'],
  cta: { label: 'Start free', href: '/start' },
};

export const PLAN_PRO: Plan = {
  ...PLAN_FREE,
  id: 'pro',
  name: 'Pro',
  price: '$5',
  cadence: 'a month',
  highlighted: true,
  cta: { label: 'Go Pro', href: '/pro' },
};

export const FAQS: readonly Faq[] = [
  { question: 'Is it free?', answer: 'Yes, the self-hosted edition is free.' },
  { question: 'Where is my data?', answer: 'On your own machine, unless you choose the hosted service.' },
];

export const NAV: readonly Link[] = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
];

export const CTA: Link = { label: 'Get started', href: '/start' };

export const FOOTER: readonly FooterColumn[] = [
  { title: 'Product', links: NAV },
  { title: 'More', links: [{ label: 'Privacy policy', href: '/docs/privacy' }] },
];
