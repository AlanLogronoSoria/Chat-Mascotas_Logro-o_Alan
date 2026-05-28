import { Room } from '../../domain/entities/Room';
import { IChatRepository } from '../../domain/repositories/IChatRepository';

export class GetRoomsUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async execute(userId: string, role: string): Promise<Room[]> {
    if (!userId || !role) throw new Error("Parámetros inválidos para obtener salas");
    return await this.chatRepo.getRooms(userId, role);
  }
}