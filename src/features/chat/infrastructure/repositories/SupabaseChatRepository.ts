import { supabase } from '../../../../shared/infrastructure/supabase/client';
import { Message } from '../../domain/entities/Message';
import { Room } from '../../domain/entities/Room';
import { IChatRepository } from '../../domain/repositories/IChatRepository';

export class SupabaseChatRepository implements IChatRepository {
    
async getMessages(roomId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(`Error al obtener mensajes: ${error.message}`);

        return (data || []).map(dbMsg => ({
            id: dbMsg.id,
            roomId: dbMsg.room_id,
            userId: dbMsg.user_id,
            content: dbMsg.content,
            imageUrl: dbMsg.image_url,
            createdAt: new Date(dbMsg.created_at),
            authorUsername: dbMsg.author_username || 'Usuario'
        }));
    }


   async sendMessage(roomId: string, userId: string, content: string, imageUrl?: string): Promise<Message> {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                room_id: roomId,
                user_id: userId,
                content: content,
                image_url: imageUrl,
            }])
            .select()
            .single();

        if (error) throw new Error(`Error al enviar mensaje: ${error.message}`);

        return {
            id: data.id,
            roomId: data.room_id,
            userId: data.user_id,
            content: data.content,
            imageUrl: data.image_url,
            createdAt: new Date(data.created_at),
            authorUsername: data.author_username || 'Usuario'
        };
    }



subscribeToMessages(roomId: string, onNewMessage: (message: any) => void) {

  const channelId = `room-${roomId}`;
  
  const channel = supabase
    .channel(channelId)

    .on(
      'postgres_changes',
      {
        event: 'INSERT', 
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`, 
      },
      (payload) => {

        onNewMessage(payload.new);
      }
    );


  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`🟢 Conectado con éxito al tiempo real de la sala: ${roomId}`);
    }
  });

  return () => {
    console.log(`🔴 Removiendo canal de tiempo real: ${channelId}`);
    supabase.removeChannel(channel);
  };
}

    async getRooms(userId: string, role: string): Promise<Room[]> {
        const normalizedRole = role?.toLowerCase().trim();

        if (normalizedRole === "cliente" || normalizedRole === "client") {
            const { data, error } = await supabase
                .from("rooms")
                .select("*, products(name)")
                .eq("created_by", userId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching rooms:", error);
                return [];
            }

            return (data || []).map((r: any) => ({
                id: r.id,
                name: r.products?.name || r.name || "",
                productName: r.products?.name || r.product_name || "Sin nombre",
                createdBy: r.created_by,
                createdAt: r.created_at,
                productId: r.product_id // 💡 Listo, mapeado sin errores
            }));
        } else {
            const { data: myProducts } = await supabase
                .from("products")
                .select("id")
                .eq("seller_id", userId);

            const productIds = myProducts?.map((p) => p.id) || [];

            if (productIds.length === 0) return [];

            const { data, error } = await supabase
                .from("rooms")
                .select("*, products(name)")
                .in("product_id", productIds)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching rooms:", error);
                return [];
            }

            return (data || []).map((r: any) => ({
                id: r.id,
                name: r.products?.name || r.name || "",
                productName: r.products?.name || r.product_name || "Sin nombre",
                createdBy: r.created_by,
                createdAt: r.created_at,
                productId: r.product_id
            }));
        }
    }

    async createRoom(userId: string, productId: string, productName: string): Promise<Room> {
        const { data: existingRoom } = await supabase
            .from('rooms')
            .select('*')
            .eq('created_by', userId)
            .eq('product_id', productId)
            .maybeSingle();

        if (existingRoom) {
            return {
                id: existingRoom.id,
                name: existingRoom.name,
                productName: existingRoom.product_name,
                createdBy: existingRoom.created_by,
                createdAt: existingRoom.created_at,
                productId: existingRoom.product_id
            };
        }

        const { data, error } = await supabase
            .from('rooms')
            .insert([{ 
                created_by: userId, 
                product_id: productId,
                product_name: productName,
                name: productName 
            }])
            .select()
            .single();

        if (error) throw new Error(`Error al crear sala: ${error.message}`);

        return {
            id: data.id,
            name: data.name,
            productName: data.product_name,
            createdBy: data.created_by,
            createdAt: data.created_at,
            productId: data.product_id
        };
    }
}