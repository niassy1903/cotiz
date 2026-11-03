import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, Gender } from '../types/auth';
import { api, ApiError, AUTH_TOKEN_KEY, getApiErrorMessage, getAuthToken, LoginChallenge } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<LoginChallenge>;
  verifyLoginOtp: (challenge: string, code: string, rememberMe?: boolean) => Promise<void>;
  resendLoginOtp: (challenge: string) => Promise<LoginChallenge>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: Gender;
    password: string;
    passwordConfirmation: string;
    organizationName?: string;
    invitationToken?: string;
    referralCode?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCurrentUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const token = getAuthToken();

    if (!token) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    api.auth.me()
      .then(authenticatedUser => {
        if (active) setUser(authenticatedUser);
      })
      .catch(error => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
        } else {
          setAuthError(getApiErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginChallenge> => {
    setAuthError(null);
    return api.auth.login(email, password);
  }, []);

  const verifyLoginOtp = useCallback(async (
    challenge: string,
    code: string,
    rememberMe = true,
  ): Promise<void> => {
    setAuthError(null);
    const result = await api.auth.verifyLoginOtp(challenge, code);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    (rememberMe ? localStorage : sessionStorage).setItem(AUTH_TOKEN_KEY, result.token);
    setUser(result.user);
  }, []);

  const resendLoginOtp = useCallback(
    (challenge: string): Promise<LoginChallenge> => api.auth.resendLoginOtp(challenge),
    [],
  );

  const signup = useCallback(async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: Gender;
    password: string;
    passwordConfirmation: string;
    organizationName?: string;
    invitationToken?: string;
    referralCode?: string;
  }): Promise<boolean> => {
    setAuthError(null);
    const result = await api.auth.register({
      ...data,
    });
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    setUser(result.user);
    return true;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (getAuthToken()) await api.auth.logout();
    } catch (error) {
      setAuthError(getApiErrorMessage(error));
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setAuthError(null);
    }
  }, []);

  const updateCurrentUserProfile = useCallback(async (data: Partial<User>): Promise<void> => {
    const updatedUser = await api.auth.updateProfile(data);
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        verifyLoginOtp,
        resendLoginOtp,
        signup,
        logout,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
