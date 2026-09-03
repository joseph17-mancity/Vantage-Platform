'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteNav() {
  const pathname = usePathname();
  const links = [
    { href: '/', label: 'Fit Report' },
    { href: '/dashboard', label: 'Dashboard' },
  ];
  return (
    <nav className="flex gap-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 text-sm font-bold transition ${active ? 'text-[#b23a2e] border-b-2 border-[#b23a2e]' : 'text-[#6e6a61] hover:text-[#1b1b18]'}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
