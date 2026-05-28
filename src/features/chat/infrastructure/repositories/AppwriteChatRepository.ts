import { Client, Databases, ID, Query } from 'react-native-appwrite';
import { Message } from '../../domain/entities/Message';
import { IChatRepository } from '../../domain/repositories/IChatRepository';

// 1. Configuración del cliente (Infraestructura)
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') 
  .setProject('6a1724a8002b65b3cfb2');

const databases = new Databases(client);
const DATABASE_ID = '6a1725b000103a08bc18';
const COLLECTION_ID = '25b000103a08bc18';

export class AppwriteChatRepository implements IChatRepository {
  
  // 2. Método de Suscripción (Realtime)
  subscribeToMessages(roomId: string, onNewMessage: (message: Message) => void) {
    return client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const payload = response.payload as any;

          if (payload.room_id === roomId) {
            const domainMessage: Message = {
              id: payload.$id,
              roomId: payload.room_id,
              userId: payload.user_id,
              content: payload.content,
              imageUrl: payload.image_url || '',
              createdAt: new Date(payload.$createdAt),
              authorUsername: payload.author_username || 'Usuario',
            };
            onNewMessage(domainMessage);
          }
        }
      }
    );
  }

  // 3. Método para enviar mensaje
  async sendMessage(roomId: string, userId: string, content: string, imageUrl?: string): Promise<Message> {
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        room_id: roomId,
        user_id: userId,
        content: content,
        author_username: 'Usuario',
        image_url: imageUrl || '',
      }
    );

    return {
      id: document.$id,
      roomId: document.room_id,
      userId: document.user_id,
      content: document.content,
      imageUrl: document.image_url,
      createdAt: new Date(document.$createdAt),
      authorUsername: document.author_username,
    };
  }

  // 4. Método para obtener historial
  async getMessages(roomId: string): Promise<Message[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('room_id', roomId), Query.orderAsc('$createdAt')]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      roomId: doc.room_id,
      userId: doc.user_id,
      content: doc.content,
      imageUrl: doc.image_url,
      createdAt: new Date(doc.$createdAt),
      authorUsername: doc.author_username,
    }));
  }

  // 5. Métodos extra para cumplir con la interfaz IChatRepository
  async createRoom(name: string): Promise<any> {
    // Si no tienes lógica de salas aún, esto cumple con el contrato
    return {};
  }

  async getRooms(): Promise<any[]> {
    // Si no tienes lógica de salas aún, esto cumple con el contrato
    return [];
  }
}