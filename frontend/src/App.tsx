import { useState } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import { DashboardPage } from './pages/DashboardPage';
import { ROUTES } from './constants';

/**
 * App Component
 * Main application router and layout wrapper
 */
function App() {
  const [currentPath] = useState<string>(ROUTES.HOME);

  // Render current page based on path
  const renderPage = () => {
    switch (currentPath) {
      case ROUTES.HOME:
        return <HomePage />;
      case ROUTES.UPLOAD:
        return <UploadPage />;
      case ROUTES.DASHBOARD:
        return <DashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <MainLayout currentPath={currentPath}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
