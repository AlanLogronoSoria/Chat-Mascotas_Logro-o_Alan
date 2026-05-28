// src/features/chat/application/use-cases/SendMessageUseCase.ts
import { ChatError } from '../../../../shared/domain/errors/AppError';
import { Message } from '../../domain/entities/Message';
import { IChatRepository } from '../../domain/repositories/IChatRepository';

export class SendMessageUseCase {
    // Nota: Asegúrate de usar el mismo nombre de variable 'chatRepo' 
    // que definiste en el constructor.
    constructor(private readonly chatRepo: IChatRepository) {}

    async execute(
        roomId: string,
        userId: string,
        content: string,
        imageUrl?: string,
    ): Promise<Message> {
        const trimmed = content.trim();

        if (!trimmed && !imageUrl) {
            throw new ChatError('El mensaje no puede estar vacío');
        }
        
        if (trimmed.length > 500) {
            throw new ChatError('El mensaje no puede tener más de 500 caracteres');
        }

        return await this.chatRepo.sendMessage(roomId, userId, trimmed, imageUrl);
    }
}