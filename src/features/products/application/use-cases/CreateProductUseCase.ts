import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';

export class CreateProductUseCase {
    constructor(private readonly productRepo: IProductRepository) {}

    async execute(
        name: string, 
        description: string, 
        price: number, 
        sellerId: string, 
        imageUrl?: string
    ): Promise<Product> {
        
        // Reglas de negocio básicas
        if (!name.trim()) throw new Error('El nombre del producto es obligatorio');
        if (price < 0) throw new Error('El precio no puede ser negativo');
        if (!sellerId) throw new Error('Se requiere un vendedor válido para publicar el producto');

        return this.productRepo.createProduct({
            name: name.trim(),
            description: description.trim(),
            price,
            sellerId,
            imageUrl
        });
    }
}