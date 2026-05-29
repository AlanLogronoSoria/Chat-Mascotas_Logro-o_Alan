import { Product } from '../entities/Product';

export interface IProductRepository {
    createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
    getProducts(): Promise<Product[]>;
    getProductById(id: string): Promise<Product | null>;
    getProductsBySeller(sellerId: string): Promise<Product[]>;
    updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'sellerId' | 'createdAt'>>): Promise<Product>;
    deleteProduct(id: string): Promise<void>;
}