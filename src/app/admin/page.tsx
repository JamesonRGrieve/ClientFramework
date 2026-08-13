import { SidebarPage } from '@/appwrapper/SidebarPage';
import Link from 'next/link';

const ADMIN_LINKS = [
  { href: '/admin/health', title: 'Health & Readiness', desc: 'Liveness, readiness, critical-provider hysteresis.' },
  { href: '/admin/dlq', title: 'Dead-Letter Queue', desc: 'View, replay, and discard failed background operations.' },
  { href: '/admin/services', title: 'Failed Services', desc: 'Supervisor list with manual reset.' },
  { href: '/admin/rotations', title: 'Rotations', desc: 'Provider rotation rules and member instances.' },
  { href: '/admin/extensions', title: 'Extension Catalog', desc: 'Installed framework extensions and their abilities.' },
];

export default function AdminLanding(): JSX.Element {
  return (
    <SidebarPage title='Operations'>
      <div className='grid grid-cols-1 gap-3 p-4 md:grid-cols-2'>
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className='block rounded-lg border p-4 transition-colors hover:bg-muted'
          >
            <div className='font-medium'>{link.title}</div>
            <div className='text-sm text-muted-foreground'>{link.desc}</div>
          </Link>
        ))}
      </div>
    </SidebarPage>
  );
}
