import { Product } from '../entities/Product';

export interface IProductRepository {
    createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
    getProducts(): Promise<Product[]>;
}