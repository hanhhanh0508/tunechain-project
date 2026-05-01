import React from 'react';
import { Header } from '../components/Header';
import { NavBar } from '../components/NavBar';
import { ROUTES } from '../constants';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentPath = ROUTES.HOME,
  className = '',
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${className}`} style={{
      background: '#0a0a0f',
      backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(100, 80, 200, 0.03) 0%, transparent 60%)
      `,
    }}>
      <Header />
      <NavBar currentPath={currentPath} />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid rgba(212, 175, 55, 0.1)',
        background: '#08080f',
        marginTop: 48,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{
              width: 1, height: 20,
              background: 'linear-gradient(180deg, transparent, #d4af37, transparent)',
            }} />
            <p style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: '#4a4a5a',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}>
              © 2026 TuneChain · All Rights Reserved
            </p>
            <div style={{
              width: 1, height: 20,
              background: 'linear-gradient(180deg, transparent, #d4af37, transparent)',
            }} />
          </div>
        </div>
      </footer>
    </div>
  );
};