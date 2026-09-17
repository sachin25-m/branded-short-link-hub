import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Attempt silent token refresh on app load or when token expires.
   */
  const refreshSession = useCallback(async () => {
    try {
      const data = await authService.refresh();
      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data.accessToken;
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null);
    }
    return null;
  }, []);

  // Check existing session on startup
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = await refreshSession();
        if (token && isMounted) {
          // Token refreshed successfully
        }
      } catch (err) {
        // No active session
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data.success) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  };

  const signup = async (userData) => {
    return await authService.signup(userData);
  };

  const verifyEmail = async (token) => {
    return await authService.verifyEmail(token);
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const resetPassword = async (payload) => {
    return await authService.resetPassword(payload);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore logout API errors
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        isAuthenticated: !!user && !!accessToken,
        login,
        signup,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
