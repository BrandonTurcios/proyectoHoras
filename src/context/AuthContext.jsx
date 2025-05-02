// src/contexts/AuthContext.jsx
import React, { useContext, useState, useEffect, createContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Insertar nuevo usuario si no existe aún
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
        ], { onConflict: 'id' }); // <- evita duplicados
        

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
      setError(error.message);
      setUser(null);
      setUserData(null);
      await supabase.auth.signOut();
    }
  };

  const signUp = async (email, password, profile) => {
    try {
      setLoading(true);
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

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
    setLoading(false);
  };

  const value = {
    user,
    userData,
    loading,
    error,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
