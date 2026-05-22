'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/event-types',
    label: 'Event Types',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/availability',
    label: 'Availability',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    href: '/bookings',
    label: 'Bookings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const bottomItems = [
  {
    href: '/john',
    label: 'My Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    external: false,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <Link href="/event-types" className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          C
        </div>
        <span className="text-white font-semibold text-sm">Cal.com Clone</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 mt-4 mb-1">
          Main
        </div>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 mt-2 mb-1">
          Account
        </div>
        {bottomItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-5 py-4 border-t border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          JD
        </div>
        <div className="min-w-0">
          <div className="text-white text-sm font-medium truncate">John Doe</div>
          <div className="text-slate-500 text-xs truncate">john@example.com</div>
        </div>
      </div>
    </aside>
  );
}
