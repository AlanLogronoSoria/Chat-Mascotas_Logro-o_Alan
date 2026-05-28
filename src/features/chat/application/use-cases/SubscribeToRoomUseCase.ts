// src/features/chat/application/use-cases/SubscribeToRoomUseCase.ts
import { Message } from '../../domain/entities/Message';
import { IChatRepository } from '../../domain/repositories/IChatRepository';

export class SubscribeToRoomUseCase {

  constructor(private chatRepository: IChatRepository) {}

  execute(roomId: string, onNewMessage: (message: Message) => void) {

    return this.chatRepository.subscribeToMessages(roomId, onNewMessage);
  }
}