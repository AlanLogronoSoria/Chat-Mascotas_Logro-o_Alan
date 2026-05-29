import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LoginUseCase } from "../../application/use-cases/LoginUseCase";
import { RegisterUseCase } from "../../application/use-cases/RegisterUseCase";
import { SupabaseAuthRepository } from "../../infrastructure/repositories/SupabaseAuthRepository";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";

type RegisterDto = { 
  email: string; 
  password: string; 
  username: string; 
  role: 'cliente' | 'vendedor' 
};

const authRepo = new SupabaseAuthRepository();
const loginUseCase = new LoginUseCase(authRepo);
const registerUseCase = new RegisterUseCase(authRepo);

export function useAuth() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUseCase.execute(email, password),
    onSuccess: (user) => {
      setUser(user);
      router.replace("/(app)");
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, username, role }: RegisterDto) =>
      registerUseCase.execute(email, password, username, role),
    onSuccess: (user) => {
      setUser(user);
      router.replace("/(app)");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => authRepo.resetPassword(email),
    onError: (error: any) => {
      console.error('Error al enviar reset de contraseña:', error?.message || error);
    }
  });

  const loginWithGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await authRepo.loginWithGoogle();
    } catch (e: any) {
      console.error('Error al iniciar sesión con Google:', e?.message || e);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authRepo.logout();
    } finally {
      setUser(null);
      router.replace("/(auth)/login");
    }
  };

  return {
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    loginWithGoogle,
    isGoogleLoading,
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordSuccess: resetPasswordMutation.isSuccess,
    logout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error:
      loginMutation.error?.message ?? registerMutation.error?.message ?? resetPasswordMutation.error?.message ?? null,
  };
}