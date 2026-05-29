import { supabase } from '../../../../shared/infrastructure/supabase/client';
import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { AppError } from '../../../../shared/domain/errors/AppError';

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

        if (error) throw new AppError('CREATE_PRODUCT_ERROR', `Error al crear producto: ${error.message}`, error);

        return this.mapProduct(data);
    }

    async getProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new AppError('GET_PRODUCTS_ERROR', `Error al obtener productos: ${error.message}`, error);

        return (data || []).map(p => this.mapProduct(p));
    }

    async getProductById(id: string): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new AppError('GET_PRODUCT_ERROR', `Error al obtener producto: ${error.message}`, error);

        return data ? this.mapProduct(data) : null;
    }

    async getProductsBySeller(sellerId: string): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });

        if (error) throw new AppError('GET_PRODUCTS_ERROR', `Error al obtener productos del vendedor: ${error.message}`, error);

        return (data || []).map(p => this.mapProduct(p));
    }

    async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'sellerId' | 'createdAt'>>): Promise<Product> {
        const updateData: Record<string, unknown> = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.price !== undefined) updateData.price = updates.price;
        if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

        const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id);

        if (error) throw new AppError('UPDATE_PRODUCT_ERROR', `Error al actualizar producto: ${error.message}`, error);

        const { data, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !data) {
            throw new AppError('UPDATE_PRODUCT_ERROR', 'Producto no encontrado o no tienes permisos para editarlo');
        }

        return this.mapProduct(data);
    }

    async deleteProduct(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw new AppError('DELETE_PRODUCT_ERROR', `Error al eliminar producto: ${error.message}`, error);
    }

    private mapProduct(data: Record<string, unknown>): Product {
        return {
            id: data.id as string,
            name: data.name as string,
            description: (data.description as string) || '',
            price: (data.price as number) || 0,
            sellerId: data.seller_id as string,
            imageUrl: data.image_url as string | undefined,
            createdAt: new Date(data.created_at as string)
        };
    }
}
