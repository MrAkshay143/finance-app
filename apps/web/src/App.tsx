import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/AppRoutes.js';
import { ToastContainer } from './components/ui/ToastContainer.js';
import { MaintenanceScreen } from './components/common/MaintenanceScreen.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { useMaintenanceStore } from './store/maintenanceStore.js';
import { useAuthStore } from './store/authStore.js';

export function App() {
  const isMaintenanceActive = useMaintenanceStore((s) => s.isMaintenanceActive);
  const user = useAuthStore((s) => s.user);

  if (isMaintenanceActive && user?.role !== 'ADMIN') {
    return <MaintenanceScreen />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
