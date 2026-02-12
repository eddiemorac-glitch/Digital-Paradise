import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany, BaseEntity } from 'typeorm';
import { NumericTransformer } from '../../../shared/utils/numeric-transformer';

import { MerchantCategory, MerchantStatus } from '../../../shared/enums/merchant.enum';
import { TaxIdType } from '../../../shared/enums/tax-id-type.enum';
import { Product } from '../../products/entities/product.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('merchants')
export class Merchant extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    userId: string;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Index()
    @Column({ type: 'enum', enum: MerchantCategory, default: MerchantCategory.RESTAURANT })
    category: MerchantCategory;

    @Column()
    address: string;

    @Column()
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    taxId: string;

    @Column({ type: 'enum', enum: TaxIdType, nullable: true })
    taxIdType: TaxIdType;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    bannerUrl: string;

    // PostGIS geography point
    @Index({ spatial: true })
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    location: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 8,
        nullable: true,
        transformer: new NumericTransformer()
    })
    latitude: number;

    @Column({
        type: 'decimal',
        precision: 11,
        scale: 8,
        nullable: true,
        transformer: new NumericTransformer()
    })
    longitude: number;

    @Index()
    @Column({ type: 'enum', enum: MerchantStatus, default: MerchantStatus.PENDING_APPROVAL })
    status: MerchantStatus;

    @OneToMany(() => Product, (product) => product.merchant)
    products: Product[];

    @OneToMany(() => Review, (review) => review.merchant)
    reviews: Review[];

    @Index()
    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isSustainable: boolean;

    @Column({ nullable: true })
    verifiedBy: string;

    @Column({ nullable: true })
    verifiedAt: Date;

    @Column({ nullable: true })
    rejectionReason: string;

    @Column({ nullable: true })
    economicActivityCode: string; // 6-digit code mandatory for v4.4

    @Column({ type: 'jsonb', nullable: true })
    verificationDocuments: { url: string; type: string; uploadedAt: Date }[];

    // --- HACIENDA v4.4 CREDENTIALS (MARKETPLACE MODEL) ---
    @Column({ nullable: true, select: false }) // Encrypted/Hidden
    haciendaUsername: string;

    @Column({ nullable: true, select: false }) // Encrypted/Hidden
    haciendaPassword: string;

    @Column({ type: 'bytea', nullable: true, select: false }) // Binary P12
    haciendaP12: Buffer;

    @Column({ nullable: true, select: false }) // Pin
    haciendaPin: string;

    @Column({ type: 'enum', enum: ['ACTIVE', 'INVALID', 'NOT_CONFIGURED'], default: 'NOT_CONFIGURED' })
    haciendaStatus: 'ACTIVE' | 'INVALID' | 'NOT_CONFIGURED';

    // --- DELIVERY LOGISTICS (Phase 16) ---
    @Column({ type: 'float', default: 5.0 })
    deliveryRadius: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 1500,
        transformer: new NumericTransformer()
    })
    baseDeliveryFee: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 200,
        transformer: new NumericTransformer()
    })
    kmFee: number;

    @Column({ default: 30 })
    prepTimeMinutes: number;

    // --- OPERATIONAL EXCELLENCE (Phase 24) ---
    @Column({ type: 'jsonb', nullable: true })
    openingHours: {
        [key: string]: { open: string; close: string; closed?: boolean }
    };

    @Column({ type: 'jsonb', nullable: true })
    socialLinks: {
        whatsapp?: string;
        instagram?: string;
        facebook?: string;
        website?: string;
    };

    @Column({ type: 'jsonb', nullable: true })
    operationalSettings: {
        isBusy?: boolean;
        busyNote?: string;
        autoCloseOnOversaturation?: boolean;
        maxConcurrentOrders?: number;
    };

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
