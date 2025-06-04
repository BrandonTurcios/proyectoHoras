import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import fondoLIGHT from '/fondoLIGHT.webp';
import fondoDARK from '/fondoDARK.webp';

const Notification = ({ type, message, onClose }) => {
  const isError = type === 'error';
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
      <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${
        isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
      }`}>
        <div className={`flex-shrink-0 ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {isError ? <AlertCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${isError ? 'text-red-800' : 'text-green-800'}`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded-full hover:bg-opacity-20 ${
            isError ? 'hover:bg-red-200' : 'hover:bg-green-200'
          }`}
        >
          <X className={`w-4 h-4 ${isError ? 'text-red-600' : 'text-green-600'}`} />
        </button>
      </div>
    </div>
  );
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    let timer;
    if (notification) {
      timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      showNotification('error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      showNotification('error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // No necesitas token, solo actualiza la contraseña
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      showNotification('success', 'Contraseña actualizada exitosamente');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Error al actualizar la contraseña. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-4"
      style={{
        backgroundImage: `url(${isDarkMode ? fondoDARK : fondoLIGHT})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.5s',
      }}
    >
      {/* Overlay para mejorar legibilidad */}
      <div className="fixed inset-0 z-0" style={{background: isDarkMode ? 'rgba(10,18,50,0.70)' : 'rgba(255,255,255,0.25)'}} />
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-md w-full space-y-8 bg-white/90 dark:bg-gray-900/90 p-8 rounded-2xl shadow-2xl">
          <div>
            <h2 className="mt-6 text-center text-2xl font-extrabold text-indigo-700 drop-shadow-sm">
              Restablecer Contraseña
            </h2>
            <p className="mt-2 text-center text-sm text-indigo-500">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-xl shadow-sm space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-indigo-700">
                  Nueva Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-indigo-200 placeholder-indigo-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-indigo-700">
                  Confirmar Nueva Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-indigo-200 placeholder-indigo-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-bold rounded-xl text-white shadow-lg transition-all duration-150 ${
                  loading
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  <span>Actualizar Contraseña</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 