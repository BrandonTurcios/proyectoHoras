// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verifica la sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    // Escucha cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          await fetchUserData(session.user.id);
        } else {
          setUser(null);
          setUserData(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Crear el perfil del usuario en la tabla users
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            ...userData,
          },
        ])
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // 1. Limpiar el token del lado del cliente
      await supabase.auth.signOut();
      
      // 2. Eliminar cualquier token residual
      localStorage.removeItem('sb-auth-token');
      sessionStorage.removeItem('sb-auth-token');
      
      // 3. Limpiar estados
      setUser(null);
      setUserData(null);
      
      // 4. Forzar limpieza de caché del navegador
      window.location.href = '/login?logout=true';
      
      // 5. Opcional: Limpiar cookies relacionadas
      document.cookie = 'sb-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    } catch (error) {
      console.error('Error durante logout:', error);
      // Fallback seguro
      window.location.href = '/login?error=logout_failed';
    }
  };

  const value = {
    user,
    userData,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};