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
