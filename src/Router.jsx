// src/Router.jsx
import React from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import BossDashboard from './components/BossDashboard';

const Router = () => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Additional check if userData hasn't loaded yet
  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Render different dashboards based on user role
  switch (userData.role) {
    case 'admin':
      return <BossDashboard />;
    case 'boss':
      return <AdminDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md">
            <h2 className="text-lg font-medium text-red-800">Error de Rol</h2>
            <p className="mt-2 text-red-600">Rol de usuario no válido</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
  }
};

export default Router;