export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    sellerId: string; // El ID del vendedor que lo publica
    imageUrl?: string;
    createdAt: Date;
}