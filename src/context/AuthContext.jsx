import React, { createContext, useContext, useState } from 'react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'lima2026';
const SESSION_KEY = 'eafc_role';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => sessionStorage.getItem(SESSION_KEY) || null);

  const loginAsGuest = () => {
    setRole('guest');
    sessionStorage.setItem(SESSION_KEY, 'guest');
  };

  const loginAsAdmin = (password) => {
    if (password === ADMIN_PASSWORD) {
      setRole('admin');
      sessionStorage.setItem(SESSION_KEY, 'admin');
      return true;
    }
    return false;
  };

  const logout = () => {
    setRole(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ role, isAdmin: role === 'admin', loginAsGuest, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
