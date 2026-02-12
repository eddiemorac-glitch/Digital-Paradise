import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get('cabys/search')
    searchCabys(@Query('q') query: string) {
        return this.productsService.searchCabys(query);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Get('merchant/:merchantId')
    @UseInterceptors(CacheInterceptor)
    findAllByMerchant(
        @Param('merchantId') merchantId: string,
        @Query('all') all?: string
    ) {
        return this.productsService.findAllByMerchant(merchantId, all !== 'true');
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Post('bulk')
    @UseGuards(ThrottlerGuard)
    findByIds(@Body('ids') ids: string[]) {
        return this.productsService.findByIds(ids);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() updateProductDto: Partial<CreateProductDto>) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
