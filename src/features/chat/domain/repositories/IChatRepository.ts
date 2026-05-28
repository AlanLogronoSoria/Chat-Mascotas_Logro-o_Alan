// src/features/chat/domain/repositories/IChatRepository.ts
import { Message } from "../entities/Message";
import { Room } from "../entities/Room";
export interface IChatRepository {
  getRooms(userId: string, role: string): Promise<Room[]>;
  
  createRoom(userId: string, productId: string, productName: string): Promise<Room>;
  
  getMessages(roomId: string): Promise<Message[]>;
  sendMessage(
    roomId: string, 
    userId: string, 
    content: string, 
    imageUrl?: string
  ): Promise<Message>;
  subscribeToMessages(roomId: string, callback: (message: Message) => void): () => void;
}