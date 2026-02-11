import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('uploads')
export class UploadsController {
    @Post('blog-image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                callback(null, `blog-${uniqueSuffix}${ext}`);
            }
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }))
    uploadBlogImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');

        // Construct public URL
        // Assuming backend runs on port 3000 or determined by env
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        return {
            url: `${baseUrl}/uploads/${file.filename}`,
            filename: file.filename
        };
    }

    @Post('product-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/products',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                callback(null, `product-${uniqueSuffix}${ext}`);
            }
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }))
    uploadProductImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');

        const baseUrl = process.env.BACKEND_URL || 'https://digital-paradise.onrender.com';
        return {
            url: `${baseUrl}/uploads/products/${file.filename}`,
            filename: file.filename
        };
    }

    @Post('merchant-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/merchants',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                callback(null, `merchant-${uniqueSuffix}${ext}`);
            }
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }))
    uploadMerchantImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');

        const baseUrl = process.env.BACKEND_URL || 'https://digital-paradise.onrender.com';
        return {
            url: `${baseUrl}/uploads/merchants/${file.filename}`,
            filename: file.filename
        };
    }
}
