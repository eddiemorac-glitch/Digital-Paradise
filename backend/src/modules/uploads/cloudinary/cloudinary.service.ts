import { Injectable, Logger } from '@nestjs/common';
import { UploadApiResponse, UploadApiErrorResponse, v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream'; // streamifier typing workaround
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
    private logger = new Logger(CloudinaryService.name);

    async uploadImage(file: Express.Multer.File, folder: string = 'uploads'): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `digital-paradise/${folder}`,
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) {
                        this.logger.error(`Cloudinary Upload Failed: ${error.message}`);
                        return reject(error);
                    }
                    resolve(result);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
}
