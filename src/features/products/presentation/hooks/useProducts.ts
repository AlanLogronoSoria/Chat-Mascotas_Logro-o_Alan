// src/features/products/presentation/hooks/useProducts.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../auth/presentation/store/authStore';
import { CreateProductUseCase } from '../../application/use-cases/CreateProductUseCase';
import { SupabaseProductRepository } from '../../infrastructure/repositories/SupabaseProductRepository';

const productRepo = new SupabaseProductRepository();
const createProductUseCase = new CreateProductUseCase(productRepo);

export function useProducts() {
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();

    // 1. Obtener la lista de productos en tiempo real
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => productRepo.getProducts(),
    });

    // 2. Mutación controlada para insertar un nuevo producto
    const createMutation = useMutation({
        mutationFn: async (params: { name: string; description: string; price: number; imageUrl?: string }) => {
            // 💡 SOLUCIÓN: Validamos de forma segura la existencia de la sesión antes de ejecutar
            if (!user || !user.id) {
                throw new Error('Debes iniciar sesión como vendedor para publicar productos.');
            }

            return createProductUseCase.execute(
                params.name, 
                params.description, 
                params.price, 
                user.id, // ID extraído de forma segura sin forzar con "!"
                params.imageUrl
            );
        },
        onSuccess: () => {
            // Sincroniza la caché inmediatamente de forma reactiva
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error: any) => {
            console.error('Error en el hook de creación de productos:', error?.message || error);
        }
    });

    return {
        products,
        isLoading,
        createProduct: createMutation.mutateAsync,
        isCreating: createMutation.isPending
    };
}