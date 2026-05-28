// src/features/chat/domain/entities/Room.ts
export interface Room {
  id: string;
  name: string;
  productName: string;
  createdBy: string;
  createdAt: string;
  productId: string; // 💡 Corrección: Agregamos el campo para el Marketplace
}