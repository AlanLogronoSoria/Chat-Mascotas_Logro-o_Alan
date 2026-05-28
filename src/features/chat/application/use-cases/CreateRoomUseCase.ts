// src/features/chat/application/use-cases/CreateRoomUseCase.ts
import { ChatError } from '../../../../shared/domain/errors/AppError';
import { Room } from '../../domain/entities/Room';
import { IChatRepository } from '../../domain/repositories/IChatRepository';

export class CreateRoomUseCase {
    constructor(private readonly chatRepo: IChatRepository) {}

    /**
     * Ejecuta la creación de una sala de chat vinculada a un producto específico.
     * Cumple con el requerimiento de simular preguntas de un cliente sobre un producto.
     * * @param userId ID del usuario con rol cliente que inicia el chat
     * @param productId ID del producto consultado
     * @param productName Nombre del producto específico por el cual se consulta
     * @returns Promesa con la entidad Room creada o recuperada
     */
    async execute(userId: string, productId: string, productName: string): Promise<Room> {
        // 💡 CORREGIDO: Se cambió 'customerId' por 'userId' para que coincida con el parámetro de la firma
        if (!userId || !userId.trim()) {
            throw new ChatError('El ID del usuario es requerido para abrir una sala de chat.');
        }

        if (!productId || !productId.trim()) {
            throw new ChatError('El ID del producto es requerido para enlazar la sala de chat.');
        }

        if (!productName || !productName.trim()) {
            throw new ChatError('El nombre del producto es requerido para iniciar la simulación de preguntas.');
        }

        // 💡 CORREGIDO: Se cambió 'this.chatRepository' por 'this.chatRepo' 
        return this.chatRepo.createRoom(userId, productId, productName);
    }
}