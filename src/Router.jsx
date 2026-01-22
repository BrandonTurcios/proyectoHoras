// src/Router.jsx
import React from 'react';
import { useAuth } from './context/AuthContext';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import BossDashboard from './components/BossDashboard';
import ResetPassword from './components/ResetPassword';

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
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      {userData.role === 'boss' && <Route path="*" element={<BossDashboard />} />}
      {userData.role === 'admin' && <Route path="*" element={<AdminDashboard />} />}
      {userData.role === 'student' && <Route path="*" element={<BossDashboard />} />}
      {/* Fallback para roles no válidos */}
      {!(userData.role === 'boss' || userData.role === 'admin' || userData.role === 'student') && (
        <Route path="*" element={
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
        } />
      )}
    </Routes>
  );
};

export default Router;