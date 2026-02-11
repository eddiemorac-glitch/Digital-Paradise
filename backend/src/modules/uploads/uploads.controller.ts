import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { memoryStorage } from 'multer';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post('blog-image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(), // CRITICAL: Use memory for Cloudinary stream
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }))
    async uploadBlogImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');
        const result = await this.cloudinaryService.uploadImage(file, 'blog');
        return {
            url: result.secure_url,
            filename: result.public_id
        };
    }

    @Post('product-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }))
    async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');
        const result = await this.cloudinaryService.uploadImage(file, 'products');
        return {
            url: result.secure_url,
            filename: result.public_id
        };
    }

    @Post('merchant-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }))
    async uploadMerchantImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');
        const result = await this.cloudinaryService.uploadImage(file, 'merchants');
        return {
            url: result.secure_url,
            filename: result.public_id
        };
    }
}
