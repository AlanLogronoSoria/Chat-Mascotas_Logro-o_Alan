import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { PetImageService } from '../../../../shared/infrastructure/supabase/PetImageService';

export class DeleteProductUseCase {
    constructor(
        private readonly productRepo: IProductRepository,
        private readonly petImageService: typeof PetImageService = PetImageService
    ) {}

    async execute(id: string, sellerId: string): Promise<void> {
        if (!id) throw new Error('El ID del producto es requerido para eliminar');
        if (!sellerId) throw new Error('Se requiere verificación del vendedor');

        const product = await this.productRepo.getProductById(id);
        if (product?.imageUrl) {
            try {
                await this.petImageService.deletePetImage(product.imageUrl);
            } catch {
                // Continue even if image deletion fails
            }
        }

        return this.productRepo.deleteProduct(id);
    }
}
