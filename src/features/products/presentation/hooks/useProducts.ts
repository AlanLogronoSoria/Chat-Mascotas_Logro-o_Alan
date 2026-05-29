import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../auth/presentation/store/authStore';
import { CreateProductUseCase } from '../../application/use-cases/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../application/use-cases/DeleteProductUseCase';
import { SupabaseProductRepository } from '../../infrastructure/repositories/SupabaseProductRepository';
import { PetImageService } from '../../../../shared/infrastructure/supabase/PetImageService';

type FileInput = { uri: string; name: string; type: string };

const productRepo = new SupabaseProductRepository();
const createProductUseCase = new CreateProductUseCase(productRepo, PetImageService);
const updateProductUseCase = new UpdateProductUseCase(productRepo, PetImageService);
const deleteProductUseCase = new DeleteProductUseCase(productRepo, PetImageService);

export function useProducts() {
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => productRepo.getProducts(),
    });

    const createMutation = useMutation({
        mutationFn: async (params: {
            name: string;
            description: string;
            price: number;
            imageUrl?: string;
            imageFile?: FileInput;
        }) => {
            if (!user || !user.id) {
                throw new Error('Debes iniciar sesión como vendedor para publicar productos.');
            }
            return createProductUseCase.execute(
                params.name,
                params.description,
                params.price,
                user.id,
                params.imageUrl,
                params.imageFile
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Error en el hook de creación de productos:', msg);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (params: {
            id: string;
            name?: string;
            description?: string;
            price?: number;
            imageUrl?: string;
            imageFile?: FileInput;
        }) => {
            if (!user || !user.id) {
                throw new Error('Debes iniciar sesión para editar productos.');
            }
            return updateProductUseCase.execute(
                params.id,
                params.name,
                params.description,
                params.price,
                params.imageUrl,
                params.imageFile
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Error al actualizar producto:', msg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!user || !user.id) {
                throw new Error('Debes iniciar sesión para eliminar productos.');
            }
            return deleteProductUseCase.execute(id, user.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Error al eliminar producto:', msg);
        }
    });

    return {
        products,
        isLoading,
        createProduct: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        updateProduct: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        deleteProduct: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
}
