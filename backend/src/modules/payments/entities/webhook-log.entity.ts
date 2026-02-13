import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('webhook_logs')
export class WebhookLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    provider: string; // 'TILOPAY'

    @Column('text')
    payload: string; // JSON string

    @Column({ nullable: true })
    orderId: string; // Extracted from payload if possible

    @Column({ default: 'PENDING' }) // PENDING, PROCESSED, FAILED, IGNORED
    status: string;

    @Column('text', { nullable: true })
    errorMessage: string;

    @Column({ default: 0 })
    retryCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
