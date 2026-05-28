// src/features/chat/presentation/hooks/useChat.ts
import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { GetMessagesUseCase } from "@features/chat/application/use-cases/GetMessagesUseCase";
import { SendMessageUseCase } from "@features/chat/application/use-cases/SendMessageUseCase";
import { SubscribeToRoomUseCase } from "@features/chat/application/use-cases/SubscribeToRoomUseCase";
import { Message } from "@features/chat/domain/entities/Message";
import { showMessageNotification } from "@shared/infrastructure/notifications/NotificationService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { SupabaseChatRepository } from "../../infrastructure/repositories/SupabaseChatRepository";

const chatRepo = new SupabaseChatRepository();

const sendMessageUseCase = new SendMessageUseCase(chatRepo);
const getMessagesUseCase = new GetMessagesUseCase(chatRepo);
const subscribeUseCase = new SubscribeToRoomUseCase(chatRepo);
export function useChat(roomId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Mantener una referencia actualizada del usuario para evitar cierres de ámbito (stale closures) en notificaciones
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Obtener mensajes de la base de datos
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: () => getMessagesUseCase.execute(roomId),
    enabled: !!user && !!roomId,
    staleTime: Infinity,
  });

  // Suscripción al canal de tiempo real con limpieza estricta del ciclo de vida
  useEffect(() => {
    if (!user || !roomId) return;

    const unsubscribe = subscribeUseCase.execute(roomId, (rawMsg: any) => {
      
      // 💡 NORMALIZACIÓN DE SEGURIDAD: Transforma snake_case de Postgres a camelCase de tu Entidad
      const newMsg: Message = {
        id: rawMsg.id,
        roomId: rawMsg.room_id || rawMsg.roomId,
        userId: rawMsg.user_id || rawMsg.userId,
        content: rawMsg.content,
        imageUrl: rawMsg.image_url || rawMsg.imageUrl,
        createdAt: rawMsg.created_at ? new Date(rawMsg.created_at) : new Date(),
        authorUsername: rawMsg.author_username || rawMsg.authorUsername || "Alguien",
      };

      // Actualizar el caché de React Query de forma reactiva
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => {
        const exists = old.some((m) => m.id === newMsg.id);
        if (exists) return old;
        return [...old, newMsg];
      });

      // Disparar notificaciones si el mensaje pertenece a otro usuario
      if (newMsg.userId !== userRef.current?.id) {
        showMessageNotification(
          roomId,
          newMsg.authorUsername ?? "Alguien",
          newMsg.content,
        );
      }
    });

    // 💡 PASO CRÍTICO: Remueve el canal antes de que React intente re-suscribirse o desmonte la vista
    return unsubscribe;
  }, [roomId, queryClient, user?.id]);

  // Mutación para enviar mensajes con soporte de interfaz optimista
  const sendMutation = useMutation({
    mutationFn: ({ content, imageUrl }: { content: string; imageUrl?: string }) =>
      sendMessageUseCase.execute(roomId, user!.id, content, imageUrl),

    onMutate: async ({ content, imageUrl }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", roomId] });

      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        roomId,
        userId: user!.id,
        content,
        imageUrl,
        createdAt: new Date(),
        authorUsername: user!.username ?? "Yo",
      };

      // Inyección optimista instantánea en la UI
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => [
        ...old,
        tempMsg,
      ]);

      return { tempMsg };
    },

    onSuccess: (realMsg, _vars, context) => {
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => {
        // Remover el mensaje temporal y colocar el real confirmado por el backend
        const withoutTemp = old.filter((m) => m.id !== context?.tempMsg.id);
        const alreadyExists = withoutTemp.some((m) => m.id === realMsg.id);
        
        if (alreadyExists) return withoutTemp;
        return [...withoutTemp, realMsg];
      });
    },

    onError: (error, _vars, context) => {
      console.error("❌ Error crítico al enviar mensaje en Supabase:", error);

      // Si falla la red, removemos el mensaje optimista para no engañar al usuario
      if (context?.tempMsg) {
        queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
          old.filter((m) => m.id !== context.tempMsg.id),
        );
      }
    },
  });

  return {
    messages,
    sendMessage: sendMutation.mutate,
    isLoading,
    isSending: sendMutation.isPending,
  };
}