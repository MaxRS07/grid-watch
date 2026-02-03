'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navigation.css';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Players', href: '/players' },
    { name: 'Teams', href: '/teams' },
    { name: 'Matches', href: '/series' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="nav-header">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-text">Grid Watch</span>
        </Link>

        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className={`nav-mobile-menu ${mobileMenuOpen ? '' : 'hidden'}`}>
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
