import type { ExtensionManifest } from '../types';
import { ExampleBannerProvider } from './provider';
import { FooterStamp } from './FooterStamp';

const NAV_ORDER_END = 1000;

const exampleBanner: ExtensionManifest = {
  id: 'example-banner',
  version: '0.0.1',
  providers: [ExampleBannerProvider],
  nav: [
    {
      title: 'Example',
      url: '/example',
      order: NAV_ORDER_END,
    },
  ],
  slots: [
    {
      id: 'nav.footer',
      render: FooterStamp,
    },
  ],
};

export default exampleBanner;
