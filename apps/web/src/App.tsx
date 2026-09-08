import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/AppRoutes.js';

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
