import { SupabaseAuthRepository } from '@features/auth/infrastructure/repositories/SupabaseAuthRepository';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { supabase } from '@shared/infrastructure/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen';

// CORREGIDO: Importamos la función correcta que sí existe en tu servicio
import { registerForPushNotificationsAsync } from '@shared/infrastructure/notifications/NotificationService';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
});

const authRepo = new SupabaseAuthRepository();

function AuthGuard() {
  const { user, setUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false); // 👈 clave del fix para evitar parpadeos de navegación

  useEffect(() => {
    // CORREGIDO: Llamada única y manejada con promesas para los permisos de notificaciones
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log("Token de notificaciones listo");
      }
    });

    async function restoreSession() {
      try {
        const currentUser = await authRepo.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error restaurando la sesión del usuario:", error);
      } finally {
        setIsReady(true);
      }
    }
    
    // Ejecutamos la restauración inicial
    restoreSession();

    // Suscripción a cambios de estado en Supabase (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        async function syncUser() {
          if (session) {
            const currentUser = await authRepo.getCurrentUser();
            setUser(currentUser);
          } else {
            setUser(null);
          }
          setIsReady(true); // 👈 Cubre ambos casos (con y sin sesión)
        }
        syncUser();
      }
    );

    // ✅ cleanup síncrono exigido por React
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // No hacer nada hasta que sepamos con certeza si hay usuario o no
    if (!isReady) return; 

    const inAuth = segments[0] === '(auth)';
    
    // Si no hay usuario y no está en la zona de auth, lo mandamos al login
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } 
    // Si ya hay usuario y está intentando ver el login/register, lo mandamos al inicio (dashboard)
    else if (user && inAuth) {
      router.replace('/'); // Redirige a app/(app)/index.tsx
    }
  }, [user, segments, isReady]);

  return <Slot />;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash ? (
        <SplashScreen onAnimationComplete={() => setShowSplash(false)} />
      ) : (
        <AuthGuard />
      )}
    </QueryClientProvider>
  );
}