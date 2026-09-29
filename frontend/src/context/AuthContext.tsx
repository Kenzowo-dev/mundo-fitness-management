import { type ReactNode } from 'react';
import { AuthContext } from './AuthContextType';
import { useCurrentUser, useLogin, useRegister, useLogout, useUpdateCurrentUser } from '../hooks/useApi';
import type { User, RegisterData } from '../types/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const updateUserMutation = useUpdateCurrentUser();

  const isAuthenticated = !!user;

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const refreshUser = () => {
    refetch();
  };

  const updateUser = async (data: Partial<User>) => {
    await updateUserMutation.mutateAsync(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}