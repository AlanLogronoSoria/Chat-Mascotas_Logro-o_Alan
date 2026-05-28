import { supabase } from '../../../../shared/infrastructure/supabase/client';
import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';

export class SupabaseProductRepository implements IProductRepository {
    
    async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: product.name,
                description: product.description,
                price: product.price,
                seller_id: product.sellerId,
                image_url: product.imageUrl
            }])
            .select()
            .single();

        if (error) throw new Error(`Error al crear producto: ${error.message}`);

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            sellerId: data.seller_id,
            imageUrl: data.image_url,
            createdAt: new Date(data.created_at)
        };
    }

    async getProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Error al obtener productos: ${error.message}`);

        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            sellerId: p.seller_id,
            imageUrl: p.image_url,
            createdAt: new Date(p.created_at)
        }));
    }
}