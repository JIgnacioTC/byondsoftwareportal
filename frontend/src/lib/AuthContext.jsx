import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const loadUserProfile = useCallback(async (accessToken) => {
    try {
      const data = await api.me(accessToken);
      if (data.user) {
        setUser(data.user);
        setClient(data.client || null);
        setSubscription(data.subscription || null);
        return data;
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
    setUser(null);
    setClient(null);
    setSubscription(null);
    return null;
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        loadUserProfile(initialSession.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        if (currentSession) {
          await loadUserProfile(currentSession.access_token);
        } else {
          setUser(null);
          setClient(null);
          setSubscription(null);
        }
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, [loadUserProfile]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Load user profile after successful login
    const profile = await loadUserProfile(data.session.access_token);

    return {
      user: profile?.user || null,
      client: profile?.client || null,
      session: data.session,
    };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClient(null);
    setSubscription(null);
    setSession(null);
  };

  const resetPasswordForEmail = async (email, redirectTo) => {
    const redirectUrl = redirectTo || `${window.location.origin}/auth/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    if (session?.access_token) {
      await loadUserProfile(session.access_token);
    }
    return data;
  };

  const refreshProfile = async () => {
    const { data: { session: curSession } } = await supabase.auth.getSession();
    if (curSession?.access_token) {
      setSession(curSession);
      return await loadUserProfile(curSession.access_token);
    }
    return null;
  };

  const getAccessToken = () => {
    return session?.access_token;
  };

  return (
    <AuthContext.Provider value={{
      user,
      client,
      subscription,
      loading,
      login,
      logout,
      resetPasswordForEmail,
      updatePassword,
      refreshProfile,
      loadUserProfile,
      session,
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
