import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogPost } from './entities/blog-post.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BlogPost]),
        NotificationsModule
    ],
    providers: [BlogService],
    controllers: [BlogController],
    exports: [BlogService],
})
export class BlogModule { }
