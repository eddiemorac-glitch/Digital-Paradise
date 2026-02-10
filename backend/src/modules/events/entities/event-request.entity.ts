import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { EventCategory, AdTier, AdSize, EventType } from '../../../shared/enums/event-monetization.enum';
import { User } from '../../users/entities/user.entity';

export enum EventRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

@Entity('event_requests')
export class EventRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column()
    date: string;

    @Column({ nullable: true })
    time: string;

    @Column({ type: 'timestamp', nullable: true })
    startDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column({ nullable: true })
    locationName: string;

    @Column({ nullable: true })
    venue: string;

    @Column({
        type: 'enum',
        enum: EventCategory,
        default: EventCategory.OTHER
    })
    category: EventCategory;

    @Column({
        type: 'enum',
        enum: EventType,
        default: EventType.SOCIAL
    })
    type: EventType;

    @Column({
        type: 'enum',
        enum: AdTier,
        default: AdTier.BRONZE
    })
    adTier: AdTier;

    @Column({
        type: 'enum',
        enum: AdSize,
        default: AdSize.SMALL
    })
    adSize: AdSize;

    @ManyToOne(() => User, { nullable: false })
    user: User;

    @Column()
    userId: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    bannerUrl: string;

    @Column({ default: false })
    isEcoFriendly: boolean;

    @Column({ nullable: true })
    contactPhone: string;

    @Column({ nullable: true })
    contactEmail: string;

    @Column({
        type: 'enum',
        enum: EventRequestStatus,
        default: EventRequestStatus.PENDING
    })
    status: EventRequestStatus;

    @Column({ nullable: true })
    rejectionReason: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'PAID', 'REFUNDED'],
        default: 'PENDING'
    })
    paymentStatus: string;

    @Column({ type: 'jsonb', nullable: true })
    paymentMetadata: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
