"use client";

import React, { createContext, useContext } from "react";

// Simplified context that doesn't use Firebase authentication
interface AuthContextType {
  user: null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Simplified provider that just renders children without authentication
  return (
    <AuthContext.Provider value={{ user: null, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
