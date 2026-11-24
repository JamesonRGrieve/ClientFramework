// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * @zephyrex/marketing: the landing-page building blocks of a Zephyrex app (header, hero,
 * sections, feature and pricing cards, a comparison, FAQ, call to action, footer, and the waitlist
 * form with the route it posts to). Each app passes its own
 * copy, so the words stay in the app and the layout, accessibility and tokens stay here.
 */

export { ComparisonTable, type ComparisonRow } from './ComparisonTable';
export { CtaBand } from './CtaBand';
export type { Availability, Faq, Feature, FooterColumn, Link, Plan } from './content';
export { FaqList } from './FaqList';
export { FeatureCard, type FeatureCardProps } from './FeatureCard';
export { Heading, type HeadingLevel, subLevel } from './Heading';
export { Hero, type HeroProps } from './Hero';
export { PricingCard, type PricingCardProps } from './PricingCard';
export { Section, type SectionProps } from './Section';
export { SiteFooter } from './SiteFooter';
export { SiteHeader, type SiteHeaderProps } from './SiteHeader';
export { createWaitlistRoute, WAITLIST_PATH, type WaitlistEntry, type WaitlistRouteOptions } from './waitlist';
export { WaitlistForm, type WaitlistFormProps } from './WaitlistForm';
