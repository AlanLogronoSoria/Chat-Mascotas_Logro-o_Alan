import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../auth/presentation/store/authStore";
import { CreateRoomUseCase } from "../../application/use-cases/CreateRoomUseCase";
import { GetRoomsUseCase } from "../../application/use-cases/GetRoomsUseCase";
import { SupabaseChatRepository } from "../../infrastructure/repositories/SupabaseChatRepository";

const chatRepo = new SupabaseChatRepository();
const getRoomsUseCase = new GetRoomsUseCase(chatRepo);
const createRoomUseCase = new CreateRoomUseCase(chatRepo);

export function useRooms() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms", user?.id],
    queryFn: () => getRoomsUseCase.execute(user!.id, user!.role ?? "cliente"),
    enabled: !!user,
  });

  const createRoomMutation = useMutation({
    // 💡 Ahora enviamos productId y productName a la mutación
    mutationFn: ({ productId, productName }: { productId: string; productName: string }) => 
      createRoomUseCase.execute(user!.id, productId, productName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", user?.id] });
    },
  });

  return {
    rooms,
    isLoading,
    createRoom: createRoomMutation.mutateAsync,
    isCreating: createRoomMutation.isPending,
  };
}