import { useState } from 'react';

import { MainLayout } from './layouts/MainLayout';

import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import { DashboardPage } from './pages/DashboardPage';

import { MiniPlayer } from './components/MiniPlayer';
import { useAudioPlayer } from './hooks/useAudioPlayer';

import { ROUTES } from './constants';

/**
 * App Component
 * Main application router and layout wrapper
 */
function App() {
  const [currentPath, setCurrentPath] = useState<string>(ROUTES.HOME);

  // Global audio player
  const player = useAudioPlayer();

  // Render current page based on path
  const renderPage = () => {
    switch (currentPath) {
      case ROUTES.HOME:
        return <HomePage player={player} />;

      case ROUTES.UPLOAD:
        return <UploadPage />;

      case ROUTES.DASHBOARD:
        return <DashboardPage player={player} />;

      default:
        return <HomePage player={player} />;
    }
  };

  return (
    <MainLayout
      currentPath={currentPath}
      onNavigate={setCurrentPath}
    >
      {renderPage()}

      {/* Global Mini Player */}
      <MiniPlayer
        track={player.currentTrack}
        isPlaying={player.isPlaying}
        progress={player.progress}
        currentTime={player.currentTime}
        duration={player.duration}
        onTogglePlay={player.togglePlay}
        onSeek={player.seek}
      />
    </MainLayout>
  );
}

export default App;