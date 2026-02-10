import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setIsLoading(true);
    setError(null);

    if (!appParams.token) {
      setError('no_token');
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Try to get employee record
      try {
        const employees = await base44.entities.Employee.filter({ user_id: currentUser.id });
        if (employees.length > 0) {
          setEmployee(employees[0]);
        }
      } catch (e) {
        // No employee yet - that's fine
      }
    } catch (e) {
      console.error('Auth failed:', e);
      setError('auth_failed');
    } finally {
      setIsLoading(false);
    }
  }

  const refresh = useCallback(async () => {
    if (!appParams.token) return;
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const employees = await base44.entities.Employee.filter({ user_id: currentUser.id });
      if (employees.length > 0) {
        setEmployee(employees[0]);
      }
    } catch (e) {
      console.error('Refresh failed:', e);
    }
  }, []);

  const redirectToLogin = useCallback(() => {
    base44.auth.redirectToLogin(window.location.href);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setEmployee(null);
    base44.auth.logout();
  }, []);

  const value = {
    user,
    employee,
    isLoading,
    error,
    isProfileComplete: user?.profile_completed === true,
    refresh,
    redirectToLogin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
