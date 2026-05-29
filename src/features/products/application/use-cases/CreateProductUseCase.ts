import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { PetImageService } from '../../../../shared/infrastructure/supabase/PetImageService';

type FileInput = { uri: string; name: string; type: string };

export class CreateProductUseCase {
    constructor(
        private readonly productRepo: IProductRepository,
        private readonly petImageService: typeof PetImageService = PetImageService
    ) {}

    async execute(
        name: string,
        description: string,
        price: number,
        sellerId: string,
        imageUrl?: string,
        imageFile?: FileInput
    ): Promise<Product> {
        if (!name.trim()) throw new Error('El nombre del producto es obligatorio');
        if (price < 0) throw new Error('El precio no puede ser negativo');
        if (!sellerId) throw new Error('Se requiere un vendedor válido para publicar el producto');

        let finalImageUrl = imageUrl;
        if (imageFile) {
            const tempId = `temp_${Date.now()}`;
            finalImageUrl = await this.petImageService.uploadPetImage(imageFile, tempId);
        }

        return this.productRepo.createProduct({
            name: name.trim(),
            description: description.trim(),
            price,
            sellerId,
            imageUrl: finalImageUrl
        });
    }
}
