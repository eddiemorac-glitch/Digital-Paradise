import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('blog_posts')
export class BlogPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    excerpt: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ nullable: true })
    coverImage: string;

    @Column({ type: 'simple-array', nullable: true })
    tags: string[];

    @Column({ default: false })
    isSustainableHighlight: boolean;

    @Column()
    authorId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column({ unique: true, nullable: true })
    slug: string;

    @Column({
        type: 'enum',
        enum: ['BLOG', 'GUIDE'],
        default: 'BLOG'
    })
    type: 'BLOG' | 'GUIDE';

    @Column({
        type: 'enum',
        enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        default: 'DRAFT'
    })
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

    @Column({ nullable: true })
    publishedAt: Date;

    @Column({ default: 0 })
    views: number;

    @Column({ default: 0 })
    likes: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
