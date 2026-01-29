import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [profileCompleted, setProfileCompleted] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // Try to load public settings (non-blocking for invited users)
      await loadPublicSettings();

      // If we have a token, always attempt authentication.
      // This is critical for invited users who arrive with an access_token.
      if (appParams.token) {
        await authenticateUser();
      } else {
        // No token at all — auth is required
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } catch (error) {
      console.error('Init error:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublicSettings = async () => {
    try {
      const appClient = createAxiosClient({
        baseURL: '/api/apps/public',
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true,
      });
      const settings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
      setAppPublicSettings(settings);
    } catch (err) {
      // Public settings errors are NOT blocking when the user has a token.
      // Invited users often get 'user_not_registered' here, which is expected —
      // they ARE registered (via invite), the SDK just hasn't fully linked them yet.
      console.warn('Public settings check failed (non-blocking):', err?.data?.extra_data?.reason || err.message);
    }
  };

  const authenticateUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);

      // Fetch linked employee record
      try {
        const employees = await base44.entities.Employee.filter({ user_id: currentUser.id });
        if (employees.length > 0) {
          setEmployee(employees[0]);
        }
      } catch (empError) {
        console.error('Error fetching employee data:', empError);
      }

      // Profile completion gate — based on User entity only
      setProfileCompleted(currentUser.profile_completed === true);
    } catch (error) {
      console.error('User auth failed:', error);
      setIsAuthenticated(false);

      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        setAuthError({ type: 'unknown', message: error.message || 'Authentication failed' });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const refreshUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const employees = await base44.entities.Employee.filter({ user_id: currentUser.id });
      if (employees.length > 0) {
        setEmployee(employees[0]);
      }
      setProfileCompleted(currentUser.profile_completed === true);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      employee,
      isAuthenticated,
      isLoading,
      authError,
      appPublicSettings,
      profileCompleted,
      logout,
      navigateToLogin,
      refreshUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
