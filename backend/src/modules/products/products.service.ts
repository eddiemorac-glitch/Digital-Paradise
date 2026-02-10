import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { Cabys } from './entities/cabys.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Cabys)
        private readonly cabysRepository: Repository<Cabys>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async searchCabys(query: string, limit = 20): Promise<Cabys[]> {
        if (!query || query.length < 2) return [];

        const cacheKey = `cabys_search_${query}_${limit}`;
        const cached = await this.cacheManager.get<Cabys[]>(cacheKey);
        if (cached) return cached;

        const results = await this.cabysRepository.find({
            where: [
                { descripcion: ILike(`%${query}%`) },
                { codigo: ILike(`${query}%`) }
            ],
            take: limit,
            order: { descripcion: 'ASC' }
        });

        await this.cacheManager.set(cacheKey, results, 3600000); // Cache for 1 hour
        return results;
    }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        const product = this.productRepository.create(createProductDto);
        const savedProduct = await this.productRepository.save(product);
        await this.invalidateMerchantCache(savedProduct.merchantId);
        return savedProduct;
    }

    async findAllByMerchant(merchantId: string, onlyAvailable = true): Promise<Product[]> {
        const cacheKey = `products_merchant_${merchantId}_${onlyAvailable}`;
        const cached = await this.cacheManager.get<Product[]>(cacheKey);
        if (cached) return cached;

        const where: any = { merchantId };
        if (onlyAvailable) where.isAvailable = true;

        const products = await this.productRepository.find({
            where,
            order: { category: 'ASC', name: 'ASC' },
        });

        await this.cacheManager.set(cacheKey, products, 600000); // 10 minutes
        return products;
    }

    async findByIds(ids: string[]): Promise<Product[]> {
        if (!ids || ids.length === 0) return [];
        return await this.productRepository.createQueryBuilder('product')
            .where('product.id IN (:...ids)', { ids })
            .getMany();
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async update(id: string, updateProductDto: Partial<CreateProductDto>): Promise<Product> {
        const product = await this.findOne(id);
        Object.assign(product, updateProductDto);
        const savedProduct = await this.productRepository.save(product);
        await this.invalidateMerchantCache(savedProduct.merchantId);
        return savedProduct;
    }

    async remove(id: string): Promise<void> {
        const product = await this.findOne(id);
        await this.productRepository.remove(product);
        await this.invalidateMerchantCache(product.merchantId);
    }

    private async invalidateMerchantCache(merchantId: string) {
        await this.cacheManager.del(`products_merchant_${merchantId}_true`);
        await this.cacheManager.del(`products_merchant_${merchantId}_false`);
    }
}
