import React, { useState } from 'react';
import { ROUTES } from '../constants';

interface NavLink {
  label: string;
  href: string;
  icon: string;
}

interface NavBarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

const NAV_LINKS: NavLink[] = [
  {
    label: 'Home',
    href: ROUTES.HOME,
    icon: '⌂',
  },
  {
    label: 'Upload',
    href: ROUTES.UPLOAD,
    icon: '↑',
  },
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: '◈',
  },
];

export const NavBar: React.FC<NavBarProps> = ({
  currentPath = ROUTES.HOME,
  onNavigate,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const isActive = (href: string) =>
    currentPath === href;

  const handleNav = (
    e: React.MouseEvent<HTMLAnchorElement>,
    link: NavLink
  ) => {
    e.preventDefault();

    if (onNavigate) {
      onNavigate(link.href);
    }

    setIsMobileMenuOpen(false);
  };

  const linkStyle = (
    active: boolean
  ): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 16px',
    textDecoration: 'none',
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
    cursor: 'pointer',
    background: active
      ? 'rgba(212,175,55,0.12)'
      : 'transparent',
    color: active ? '#d4af37' : '#7a7a8a',
    borderBottom: active
      ? '2px solid #d4af37'
      : '2px solid transparent',
    paddingBottom: 4,
    marginBottom: -1,
  });

  return (
    <nav
      className={className}
      style={{
        background: '#0a0a0f',
        borderBottom:
          '1px solid rgba(212,175,55,0.1)',
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Desktop */}
          <div className="hidden md:flex items-center h-12 gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) =>
                  handleNav(e, link)
                }
                style={linkStyle(
                  isActive(link.href)
                )}
              >
                <span style={{ fontSize: 14 }}>
                  {link.icon}
                </span>

                <span className="hidden lg:inline">
                  {link.label}
                </span>
              </a>
            ))}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center justify-between h-12">
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#7a7a8a',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {NAV_LINKS.find(
                (l) =>
                  l.href === currentPath
              )?.label ?? 'Menu'}
            </span>

            <button
              onClick={() =>
                setIsMobileMenuOpen(
                  !isMobileMenuOpen
                )
              }
              style={{
                background: 'none',
                border: 'none',
                color: '#d4af37',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              {isMobileMenuOpen
                ? '✕'
                : '☰'}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          style={{
            background: '#0d0d18',
            borderTop:
              '1px solid rgba(212,175,55,0.1)',
            padding: '12px 16px',
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(
              link.href
            );

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) =>
                  handleNav(e, link)
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 6,
                  marginBottom: 4,
                  textDecoration: 'none',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  color: active
                    ? '#d4af37'
                    : '#888',
                  background: active
                    ? 'rgba(212,175,55,0.08)'
                    : 'transparent',
                }}
              >
                <span>{link.icon}</span>
                {link.label}
              </a>
            );
          })}
        </div>
      )}
    </nav>
  );
};