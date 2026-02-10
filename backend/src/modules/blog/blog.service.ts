import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class BlogService {
    constructor(
        @InjectRepository(BlogPost)
        private readonly blogRepository: Repository<BlogPost>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async findAll(status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'): Promise<BlogPost[]> {
        const where = status ? { status } : { status: 'PUBLISHED' as any };
        return await this.blogRepository.find({
            where,
            relations: ['author'],
            order: { createdAt: 'DESC' }
        });
    }

    async findAllAdmin(): Promise<BlogPost[]> {
        return await this.blogRepository.find({
            relations: ['author'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<BlogPost> {
        const post = await this.blogRepository.findOne({
            where: { id },
            relations: ['author']
        });
        if (!post) throw new NotFoundException(`Post ${id} not found`);

        // Increment views
        post.views += 1;
        await this.blogRepository.save(post);

        return post;
    }

    async create(data: Partial<BlogPost>, userId: string): Promise<BlogPost> {
        const post = this.blogRepository.create({
            ...data,
            authorId: userId,
            publishedAt: data.status === 'PUBLISHED' ? new Date() : null
        });
        const saved = await this.blogRepository.save(post);

        // If it's a sustainability highlight, notify everyone
        if (saved.isSustainableHighlight && saved.status === 'PUBLISHED') {
            await this.notificationsService.create({
                title: '📖 Nueva Historia Sostenible',
                message: `${saved.title}: Una nueva historia de impacto en el Caribe.`,
                type: NotificationType.ECO,
                actionLink: `/blog/${saved.id}`
            });
        }

        return saved;
    }

    async update(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
        const post = await this.findOne(id);

        if (data.status === 'PUBLISHED' && post.status !== 'PUBLISHED') {
            data.publishedAt = new Date();
        }

        Object.assign(post, data);
        return await this.blogRepository.save(post);
    }

    async remove(id: string): Promise<void> {
        const result = await this.blogRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Post ${id} not found`);
    }

    async seed() {
        const count = await this.blogRepository.count();
        if (count > 0) return;

        const posts = [
            {
                title: "Rescate de Corales en Gandoca",
                excerpt: "Conoce el proyecto que está devolviendo la vida a nuestros arrecifes.",
                content: "El proyecto de restauración coralina en Gandoca ha logrado sembrar más de 500 fragmentos de coral en el último año...",
                tags: ["Sostenibilidad", "Gandoca", "Vida Marina"],
                isSustainableHighlight: true,
                coverImage: "https://images.unsplash.com/photo-1546500840-ae38253aba9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            },
            {
                title: "Pura Vida en la Cocina: Ninja Sushi",
                excerpt: "Cómo la fusión japonesa-caribeña está revolucionando Puerto Viejo.",
                content: "Ninja Sushi no es solo un restaurante, es un experimento social que utiliza productos de pescadores locales...",
                tags: ["Gastronomía", "Cultura", "Puerto Viejo"],
                isSustainableHighlight: false,
                coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            }
        ];

        // We need an admin user ID for seeding. We'll search for one or just use a placeholder if needed.
        // For simplicity in seeding, the first post will be assigned to whatever user created it via the controller.
    }
}
