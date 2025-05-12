// src/App.jsx
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Router from './Router'

const App = () => {
  useEffect(() => {
    const handler = (e) => {
      // Previene cualquier intento de reload por visibilidad
      e.stopImmediatePropagation();
    };
    document.addEventListener('visibilitychange', handler, true);
    return () => document.removeEventListener('visibilitychange', handler, true);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;