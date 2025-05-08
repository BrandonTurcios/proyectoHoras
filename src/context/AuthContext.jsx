// src/contexts/AuthContext.jsx
import React, { useContext, useState, useEffect, createContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setUser(session.user);
          fetchUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserData(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userObj) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userObj.id);

      if (error) throw error;

      if (data.length === 0) {
        const { error: insertError } = await supabase.from('users').upsert([
          {
            id: userObj.id,
            email: userObj.email,
            full_name: userObj.user_metadata?.full_name || '',
            role: userObj.user_metadata?.role || 'student',
            internship_area: userObj.user_metadata?.internship_area || '',
            hours_required: userObj.user_metadata?.hours_required || 0,
            current_hours: 0,
          }
        ], { onConflict: 'id' });

        if (insertError) throw insertError;

        setUserData({
          id: userObj.id,
          email: userObj.email,
          full_name: userObj.user_metadata?.full_name || '',
          role: userObj.user_metadata?.role || 'student',
          internship_area: userObj.user_metadata?.internship_area || '',
          hours_required: userObj.user_metadata?.hours_required || 0,
          current_hours: 0,
        });
      } else {
        setUserData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
      setUserData(null);
    }
  };

  const signUp = async (email, password, profile) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profile.full_name,
            role: profile.role,
            internship_area: profile.internship_area,
            hours_required: profile.hours_required
          }
        }
      });

      if (error) {
        console.log('Error completo de Supabase:', error); // Para debugging
        // Manejar errores específicos de registro
        if (error.message?.includes('User already registered')) {
          throw new Error('Este correo ya está registrado. Por favor, inicia sesión.');
        }
        if (error.message?.includes('Password should be at least 6 characters')) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        if (error.message?.includes('Invalid email')) {
          throw new Error('El formato del correo electrónico no es válido.');
        }
        // Si no es ninguno de los anteriores, lanzar el error original
        throw new Error(error.message || 'Error al registrar usuario');
      }
      return { data, error: null };
    } catch (error) {
      console.log('Error capturado:', error); // Para debugging
      return { data: null, error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log('Error completo de Supabase:', error); // Para debugging
        // Manejar errores específicos de inicio de sesión
        if (error.message?.includes('Email not confirmed')) {
          return { data: null, error: 'Por favor, verifica tu correo electrónico antes de iniciar sesión.' };
        }
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('Invalid email or password')) {
          return { data: null, error: 'El correo o la contraseña son incorrectos.' };
        }
        if (error.message?.includes('Invalid email')) {
          return { data: null, error: 'El formato del correo electrónico no es válido.' };
        }
        if (error.message?.includes('Rate limit exceeded')) {
          return { data: null, error: 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.' };
        }
        // Si no es ninguno de los anteriores, lanzar el error original
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error) {
      console.log('Error capturado:', error); // Para debugging
      return { data: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const value = {
    user,
    userData,
    loading,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
