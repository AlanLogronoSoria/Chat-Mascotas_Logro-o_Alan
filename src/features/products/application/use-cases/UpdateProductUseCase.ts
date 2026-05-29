import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { PetImageService } from '../../../../shared/infrastructure/supabase/PetImageService';

type FileInput = { uri: string; name: string; type: string };

export class UpdateProductUseCase {
    constructor(
        private readonly productRepo: IProductRepository,
        private readonly petImageService: typeof PetImageService = PetImageService
    ) {}

    async execute(
        id: string,
        name?: string,
        description?: string,
        price?: number,
        imageUrl?: string,
        imageFile?: FileInput
    ): Promise<Product> {
        if (!id) throw new Error('El ID del producto es requerido para actualizar');
        if (name !== undefined && !name.trim()) throw new Error('El nombre del producto no puede estar vacío');
        if (price !== undefined && price < 0) throw new Error('El precio no puede ser negativo');

        let finalImageUrl = imageUrl;

        if (imageFile) {
            const existing = await this.productRepo.getProductById(id);
            const oldUrl = existing?.imageUrl || '';

            finalImageUrl = await this.petImageService.updatePetImage(
                oldUrl,
                imageFile,
                id
            );
        }

        const updates: Partial<Omit<Product, 'id' | 'sellerId' | 'createdAt'>> = {};
        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description.trim();
        if (price !== undefined) updates.price = price;
        if (finalImageUrl !== undefined) updates.imageUrl = finalImageUrl;

        return this.productRepo.updateProduct(id, updates);
    }
}
