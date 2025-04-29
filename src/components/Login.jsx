// src/components/Login.jsx
import React, { useState,useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Ajusta la ruta según tu estructura

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  // En tu componente de Login
useEffect(() => {
  const checkLogout = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('logout') === 'true') {
      // Limpieza adicional al llegar a login desde logout
      await supabase.auth.signOut();
    }
  };
  checkLogout();
}, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw new Error(error);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }

        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          role: formData.role,
          internship_area: formData.internshipArea,
          hours_required: formData.hoursRequired,
          current_hours: 0
        });

        if (error) throw new Error(error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const regex = /^[A-Za-z0-9._%+-]+@gmail\.com$/;

    return regex.test(email);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Institucional
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="correo@unitec.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar Contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Juan Pérez"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Rol
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="student">Estudiante</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="internshipArea" className="block text-sm font-medium text-gray-700">
                    Área de Pasantía
                  </label>
                  <select
                    id="internshipArea"
                    name="internshipArea"
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                    value={formData.internshipArea}
                    onChange={(e) => setFormData({ ...formData, internshipArea: e.target.value })}
                  >
                    <option value="">Seleccionar área</option>
                    <option value="ingenieria">Ingeniería</option>
                    <option value="ciencias">Ciencias</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="laboratorios">Laboratorios</option>
                  </select>
                </div>

                {formData.role === 'student' && (
                  <div>
                    <label htmlFor="hoursRequired" className="block text-sm font-medium text-gray-700">
                      Horas Requeridas
                    </label>
                    <input
                      id="hoursRequired"
                      name="hoursRequired"
                      type="number"
                      required
                      min="1"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
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
              disabled={loading || (formData.email && !validateEmail(formData.email))}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading || (formData.email && !validateEmail(formData.email))
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLogin ? (
                  <LogIn className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                ) : (
                  <UserPlus className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                )}
              </span>
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    </div>
  );
};

export default Login;