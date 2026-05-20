// frontend/src/components/NavBar.tsx
import React, { useState } from 'react';
import { ROUTES, UI_TEXT } from '../constants';
import { useWallet } from '../hooks/useWallet';

interface NavLink {
  label: string;
  href: string;
  icon: string;
  requiresWallet?: boolean;
}

interface NavBarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home',      href: ROUTES.HOME,      icon: '⌂', requiresWallet: false },
  { label: 'Upload',    href: ROUTES.UPLOAD,    icon: '↑', requiresWallet: false },  // ← đổi true → false
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: '◈', requiresWallet: false },  // ← đổi true → false
];

export const NavBar: React.FC<NavBarProps> = ({
  currentPath = ROUTES.HOME,
  onNavigate,
  className = '',
}) => {
  const { isConnected } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive   = (href: string) => currentPath === href;
  const isDisabled = (link: NavLink) => (link.requiresWallet ?? false) && !isConnected;

  const handleNav = (
    e: React.MouseEvent<HTMLAnchorElement>,
    link: NavLink
  ) => {
    e.preventDefault();
    if (isDisabled(link)) return;
    if (onNavigate) {
      onNavigate(link.href);
    }
    setIsMobileMenuOpen(false);
  };

  const linkStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 16px',
    textDecoration: 'none',
    fontFamily: "'Courier New', monospace",
    fontSize: 12, fontWeight: 600,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    transition: 'all 0.2s',
    opacity: disabled ? 0.35 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: active ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
    color: active ? '#d4af37' : '#7a7a8a',
    borderBottom: active ? '2px solid #d4af37' : '2px solid transparent',
    paddingBottom: 4,
    marginBottom: -1,
  });

  return (
    <nav
      className={className}
      style={{
        background: '#0a0a0f',
        borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Desktop nav */}
          <div className="hidden md:flex items-center h-12 gap-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={e => handleNav(e, link)}
                title={isDisabled(link) ? `${UI_TEXT.CONNECT_WALLET} to access` : undefined}
                style={linkStyle(isActive(link.href), isDisabled(link))}
              >
                <span style={{ fontSize: 14 }}>{link.icon}</span>
                <span className="hidden lg:inline">{link.label}</span>
              </a>
            ))}
          </div>

          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between h-12">
            <span style={{
              fontFamily: 'monospace', fontSize: 11,
              color: '#7a7a8a', letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              {NAV_LINKS.find(l => l.href === currentPath)?.label ?? 'Menu'}
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: 18 }}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobileMenuOpen && (
        <div style={{
          background: '#0d0d18',
          borderTop: '1px solid rgba(212, 175, 55, 0.1)',
          padding: '12px 16px',
        }}>
          {NAV_LINKS.map(link => {
            const active   = isActive(link.href);
            const disabled = isDisabled(link);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={e => handleNav(e, link)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 6, marginBottom: 4,
                  textDecoration: 'none',
                  fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.1em',
                  color: active ? '#d4af37' : '#888',
                  background: active ? 'rgba(212,175,55,0.08)' : 'transparent',
                  opacity: disabled ? 0.35 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <span>{link.icon}</span> {link.label}
              </a>
            );
          })}
        </div>
      )}
    </nav>
  );
};