import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    setAuthError(null);

    // No token means user needs to log in
    if (!appParams.token) {
      setAuthError('no_token');
      setIsLoading(false);
      return;
    }

    try {
      // Authenticate user with the token
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Try to fetch employee record (may not exist yet for new users)
      try {
        const employees = await base44.entities.Employee.filter({ user_id: currentUser.id });
        if (employees.length > 0) {
          setEmployee(employees[0]);
        }
      } catch (e) {
        // No employee record yet - that's fine for new users
        console.log('No employee record found for user');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError('auth_failed');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = useCallback(async () => {
    if (!appParams.token) return;

    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const employees = await base44.entities.Employee.filter({ user_id: currentUser.id });
      if (employees.length > 0) {
        setEmployee(employees[0]);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, []);

  const logout = () => {
    setUser(null);
    setEmployee(null);
    base44.auth.logout();
  };

  const redirectToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  // Profile is complete if user has first_name, last_name, and profile_completed flag
  const isProfileComplete = user?.profile_completed === true;

  return (
    <AuthContext.Provider value={{
      user,
      employee,
      isLoading,
      authError,
      isProfileComplete,
      refreshUserData,
      logout,
      redirectToLogin,
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
