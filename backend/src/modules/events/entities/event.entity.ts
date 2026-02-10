import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne } from 'typeorm';
import { EventCategory, AdTier, AdSize, EventType } from '../../../shared/enums/event-monetization.enum';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { NumericTransformer } from '../../../shared/utils/numeric-transformer';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column()
    date: string; // For display: "Hoy, 5:00 PM" or specific date

    @Column({ nullable: true })
    time: string; // HH:mm format for filtering "upcoming events"

    @Column({ type: 'timestamp', nullable: true })
    @Index()
    startDate: Date; // For precise chronological sorting

    @Column({ nullable: true })
    locationName: string; // Renamed from location to avoid confusion with geography

    @Column({ nullable: true })
    venue: string; // Specific venue name

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Index({ spatial: true })
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    location: string;

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

    @ManyToOne(() => Merchant, { nullable: true })
    merchant: Merchant;

    @Column({ nullable: true })
    merchantId: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    bannerUrl: string; // For cinematic overlay

    @Column({ default: 0 })
    attendees: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new NumericTransformer()
    })
    price: number;

    @Column({ default: 'CRC' })
    currency: string;

    @Column({ default: 0 })
    maxCapacity: number;

    @Column({ default: 0 })
    soldTickets: number;

    @Column({ default: false })
    isEcoFriendly: boolean;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
