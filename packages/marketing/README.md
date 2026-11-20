# @zephyrex/marketing

The landing page of a Zephyrex app, built from the app's own copy:

- `SiteHeader`, with a no-script menu on narrow screens, since the framework hides its sidebar
  on `/`;
- `Hero`, which carries the page's one h1 and a slot for a live sample of the product;
- `Section` and the caller-levelled `Heading`, so the heading outline stays unbroken;
- `FeatureCard`, which badges features only the hosted service has;
- `PricingCard`, `FaqList` (native disclosure widgets), `CtaBand` and `SiteFooter`.

The components hold no product words beyond accessible defaults. Each app keeps its copy in its
own content module and passes it in, so prices, promises and principles stay with the app.

## Install

```bash
pnpm add @zephyrex/marketing
```

Peer dependencies: `zephyrex`, `next` and `react`. Add the package's `dist/` to your
stylesheet's `@source` list, as for the other Zephyrex packages.

## Use

```tsx
import { CtaBand, FeatureCard, Hero, Section, SiteFooter, SiteHeader } from '@zephyrex/marketing';
import { CONTENT } from '~/content/marketing';

export default function Landing() {
  return (
    <>
      <SiteHeader brand={<AppLogo />} nav={CONTENT.nav} cta={CONTENT.cta} />
      <main className='container mx-auto max-w-5xl px-4'>
        <Hero title={CONTENT.title} lead={CONTENT.lead} primary={CONTENT.cta} sample={<LiveSample />} />
        <Section id='features' title='Features'>
          {CONTENT.features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </Section>
        <CtaBand {...CONTENT.closing} />
        <SiteFooter columns={CONTENT.footer} note={CONTENT.footerNote} />
      </main>
    </>
  );
}
```

Show a hosted-only feature by what the server offers (`GET /v1/extension`), never by an
edition flag.

## License

AGPL-3.0-or-later
