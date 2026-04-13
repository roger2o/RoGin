'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/builder', label: 'Recipe Builder' },
  { href: '/log', label: 'Batch Log' },
  { href: '/beginner', label: 'Beginner Guide' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'var(--nav-bg)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-wide"
          style={{ color: 'var(--accent)' }}
        >
          RoGin
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors"
              style={{
                color:
                  pathname === item.href
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1">
            <span
              className="block h-0.5 rounded transition-transform"
              style={{
                background: 'var(--text-primary)',
                transform: menuOpen ? 'rotate(45deg) translate(2px, 4px)' : '',
              }}
            />
            <span
              className="block h-0.5 rounded transition-opacity"
              style={{
                background: 'var(--text-primary)',
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-0.5 rounded transition-transform"
              style={{
                background: 'var(--text-primary)',
                transform: menuOpen ? 'rotate(-45deg) translate(2px, -4px)' : '',
              }}
            />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-3 flex flex-col gap-3"
          style={{
            background: 'var(--nav-bg-mobile)',
            borderColor: 'var(--border)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-base font-medium py-2"
              style={{
                color:
                  pathname === item.href
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
