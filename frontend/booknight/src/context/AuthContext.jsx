import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'booknight_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    // No token yet - the backend creates an unverified account and emails
    // a code. Caller (RegisterPage) redirects to the verify-email step.
    return api.register({ email, password, displayName });
  }, []);

  const verifyEmail = useCallback(async (email, code) => {
    const data = await api.verifyEmail({ email, code });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const resendVerification = useCallback(async (email) => {
    return api.resendVerification({ email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, verifyEmail, resendVerification, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}