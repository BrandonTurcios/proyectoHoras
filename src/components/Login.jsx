// src/components/Login.jsx
import React, { useState,useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, UserPlus, LogIn, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import { supabase } from '../lib/supabase'; // Ajusta la ruta según tu estructura
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

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { signIn, signUp } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student',
    internshipArea: '',
    hoursRequired: 120
  });

  const [areas, setAreas] = useState([]);

  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchAreas = async () => {
      const { data, error } = await supabase.from('areas').select('*');
      if (!error && data) setAreas(data);
    };
    fetchAreas();
  }, []);

  // Detectar el rol automáticamente según el correo
  useEffect(() => {
    if (!isLogin && formData.email) {
      const emailDomain = formData.email.split('@')[1];
      if (emailDomain === 'unitec.edu.hn') {
        setFormData(prev => ({ ...prev, role: 'admin' }));
      } else if (emailDomain === 'unitec.edu') {
        setFormData(prev => ({ ...prev, role: 'student' }));
      }
    }
  }, [formData.email, isLogin]);
  // En tu componente de Login
  useEffect(() => {
    const handleLogoutRedirect = async () => {
      const params = new URLSearchParams(window.location.search);
      
      if (params.get('logout') === 'true') {
        try {
          // Forzar limpieza de sesión
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          
          // Limpiar la URL
          window.history.replaceState({}, document.title, '/login');
        } catch (error) {
          console.error('Error cleaning up session:', error);
        }
      }
    };
  
    handleLogoutRedirect();
  }, []);

  useEffect(() => {
    let timer;
    if (notification) {
      timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const getErrorMessage = (error) => {
    if (!error) return 'Credenciales incorrectas';
    
    const errorMessage = error.toString().toLowerCase();
    
    // Errores de verificación de correo (prioridad alta)
    if (errorMessage.includes('email not confirmed') || 
        errorMessage.includes('please verify your email') ||
        errorMessage.includes('email not verified') ||
        errorMessage.includes('verifica tu correo electrónico') ||
        errorMessage.includes('unverified email')) {
      return 'Por favor, verifica tu correo electrónico antes de iniciar sesión';
    }

    // Errores de autenticación
    if (errorMessage.includes('invalid login credentials') || 
        errorMessage.includes('bad request') || 
        errorMessage.includes('400') ||
        errorMessage.includes('invalid email or password')) {
      return 'El correo o la contraseña son incorrectos';
    }

    // Errores de correo electrónico
    if (errorMessage.includes('email already registered')) {
      return 'Este correo ya está registrado. Por favor, inicia sesión';
    }
    if (errorMessage.includes('invalid email')) {
      return 'El formato del correo electrónico no es válido';
    }
    
    // Errores de contraseña
    if (errorMessage.includes('password')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Errores de conexión
    if (errorMessage.includes('network') || 
        errorMessage.includes('connection') || 
        errorMessage.includes('timeout')) {
      return 'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet';
    }

    // Errores de servidor
    if (errorMessage.includes('500') || 
        errorMessage.includes('server') || 
        errorMessage.includes('internal')) {
      return 'El servidor no está respondiendo. Por favor, intenta más tarde';
    }
    
    // Error por defecto
    return 'Credenciales incorrectas';
  };

  




  const isFormValid = () => {
    if (isLogin) {
      return formData.email.trim() !== '' && formData.password.trim() !== '';
    } else {
      return (
        formData.email.trim() !== '' &&
        formData.password.trim() !== '' &&
        formData.confirmPassword.trim() !== '' &&
        formData.fullName.trim() !== '' &&
        formData.internshipArea !== '' &&
        formData.password === formData.confirmPassword
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!isLogin && !validateEmail(formData.email)) {
      showNotification('error', 'Solo se permiten correos @unitec.edu o @unitec.edu.hn');
      return;
    }// Permitir cualquier email temporalmente
    // Validación inicial
    if (!isFormValid()) {
      showNotification('error', isLogin 
        ? 'Por favor, completa todos los campos'
        : 'Por favor, completa todos los campos y asegúrate de que las contraseñas coincidan'
      );
      return;
    }
    
    if (loading) return;
    
    // Validación inicial
    if (!isFormValid()) {
      showNotification('error', isLogin 
        ? 'Por favor, completa todos los campos'
        : 'Por favor, completa todos los campos y asegúrate de que las contraseñas coincidan'
      );
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await signIn(formData.email, formData.password);
        if (error) {
          // Verificar específicamente el error de correo no verificado
          if (error.includes('verifica tu correo electrónico')) {
            showNotification('error', 'Por favor, verifica tu correo electrónico antes de iniciar sesión');
          } else {
            showNotification('error', getErrorMessage(error));
          }
          setLoading(false);
          return;
      
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          showNotification('error', 'Las contraseñas no coinciden');
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          role: formData.role,
          internship_area: formData.internshipArea,
          hours_required: formData.hoursRequired,
          current_hours: 0
        });

        if (error) {
          showNotification('error', getErrorMessage(error));
          setLoading(false);
          return;
        }
        
        showNotification('success', '¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
        setTimeout(() => {
          setIsLogin(true);
        }, 5000);
        if (error) {
          showNotification('error', getErrorMessage(error));
          setLoading(false);
          return;
        }
        
        showNotification('success', '¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
        setTimeout(() => {
          setIsLogin(true);
        }, 5000);
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', getErrorMessage(error.message));
      console.error('Error:', error);
      showNotification('error', getErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    if (!email) return false;
    const validDomains = ['unitec.edu', 'unitec.edu.hn'];
    const domain = email.split('@')[1];
    return validDomains.includes(domain);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showNotification('error', 'Por favor, ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(resetEmail)) {
      showNotification('error', 'Por favor, ingresa un correo institucional válido');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      showNotification('success', 'Se ha enviado un correo con instrucciones para restablecer tu contraseña');
      setShowResetPassword(false);
      setResetEmail('');
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Error al enviar el correo de recuperación. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderResetPasswordForm = () => (
    <div className="max-w-md w-full space-y-8 bg-white/90 dark:bg-gray-900/90 p-8 rounded-2xl shadow-2xl">
      <div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-indigo-700 drop-shadow-sm">
          Recuperar Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-indigo-500">
          Ingresa tu correo institucional para recibir instrucciones
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
        <div className="rounded-xl shadow-sm space-y-4">
          <div>
            <label htmlFor="resetEmail" className="block text-sm font-bold text-indigo-700">
              Correo Institucional
            </label>
            <div className="mt-1 relative">
              <input
                id="resetEmail"
                name="resetEmail"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-indigo-200 placeholder-indigo-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600"
                placeholder="correo@unitec.edu"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
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
              <span>Enviar Instrucciones</span>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setShowResetPassword(false)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </form>
    </div>
  );

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
        {/* Título principal */}
        <h1 className="text-5xl font-extrabold text-center mb-8 text-indigo-800 dark:text-indigo-200 drop-shadow-lg">
          <span className="hidden sm:inline">Sistema de Administración de Becados</span>
          <span className="inline sm:hidden">SADEBEC</span>
        </h1>
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
        {showResetPassword ? (
          renderResetPasswordForm()
        ) : (
          <div className="max-w-md w-full space-y-8 bg-white/90 dark:bg-gray-900/90 p-8 rounded-2xl shadow-2xl">
            <div>
              <h2 className="mt-6 text-center text-2xl font-extrabold text-indigo-700 drop-shadow-sm">
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h2>
              <p className="mt-2 text-center text-base text-indigo-500">
                {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setNotification(null);
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors"
                >
                  {isLogin ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="rounded-xl shadow-sm space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-indigo-700">
                    Correo Institucional
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-indigo-200 placeholder-indigo-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600"
                      placeholder="correo@unitec.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-indigo-700">
                    Contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-indigo-200 placeholder-indigo-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {isLogin && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-bold text-indigo-700">
                        Confirmar Contraseña
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          className="appearance-none relative block w-full px-3 py-2 border border-indigo-200 placeholder-indigo-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                        <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="fullName" className="block text-sm font-bold text-indigo-700">
                        Nombre Completo
                      </label>
                      <div className="mt-1">
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required
                          className="appearance-none relative block w-full px-3 py-2 border border-indigo-200 placeholder-indigo-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600"
                          placeholder="Juan Pérez"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-indigo-700 mb-1">Tipo de usuario</label>
                      <div className="px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold">
                        {formData.role === 'admin' ? 'Administrador' : 'Estudiante'}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="internshipArea" className="block text-sm font-bold text-indigo-700">
                        Área de Pasantía
                      </label>
                      <select
                        id="internshipArea"
                        name="internshipArea"
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 sm:text-sm rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600 placeholder-indigo-400 dark:placeholder-gray-400"
                        value={formData.internshipArea}
                        onChange={(e) => setFormData({ ...formData, internshipArea: e.target.value })}
                      >
                        <option value="">Seleccionar área</option>
                        {areas.map(area => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                    </div>

                    {formData.role === 'student' && (
                      <div>
                        <label htmlFor="hoursRequired" className="block text-sm font-bold text-indigo-700">
                          Horas Requeridas
                        </label>
                        <input
                          id="hoursRequired"
                          name="hoursRequired"
                          type="number"
                          required
                          min="1"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 sm:text-sm rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-indigo-200 dark:border-gray-600"
                          value={formData.hoursRequired}
                          onChange={(e) => setFormData({ ...formData, hoursRequired: parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                  </>
                )}
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
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {isLogin ? (
                      <LogIn className="h-6 w-6 text-indigo-200 group-hover:text-indigo-100" />
                    ) : (
                      <UserPlus className="h-6 w-6 text-indigo-200 group-hover:text-indigo-100" />
                    )}
                  </span>
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    <span>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;