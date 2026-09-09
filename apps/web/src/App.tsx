import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/AppRoutes.js';
import { ToastContainer } from './components/ui/ToastContainer.js';

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
