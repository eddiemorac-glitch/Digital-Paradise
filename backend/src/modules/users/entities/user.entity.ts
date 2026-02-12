import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BaseEntity } from 'typeorm';
import { UserRole } from '../../../shared/enums/user-role.enum';
import { VehicleType } from '../../../shared/enums/vehicle-type.enum';
import { TaxIdType } from '../../../shared/enums/tax-id-type.enum';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ default: 0 })
    points: number;

    @Column({ select: false })
    password: string;

    @Column()
    fullName: string;

    @Column({ nullable: true })
    avatarId: string;

    @Index()
    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CLIENT,
    })
    role: UserRole;

    @Index()
    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    taxId: string;

    @Column({ type: 'enum', enum: TaxIdType, nullable: true })
    taxIdType: TaxIdType;

    @Index()
    @Column({ default: true })
    isActive: boolean;

    // --- Courier / Driver specific fields ---
    @Column({
        type: 'enum',
        enum: VehicleType,
        nullable: true,
    })
    vehicleType: VehicleType;

    @Column({ nullable: true })
    vehiclePlate: string;

    @Column({ default: false })
    isOnline: boolean;

    @Index()
    @Column({
        type: 'varchar',
        length: 20,
        default: 'PENDING',
        nullable: true
    })
    courierStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';

    @Column({ nullable: true })
    verificationReason: string;

    @Column({ nullable: true })
    idCardImageUrl: string;

    @Column({ nullable: true })
    licenseImageUrl: string;

    @Column({ default: true })
    acceptsFood: boolean;

    @Column({ default: true })
    acceptsParcel: boolean;

    @Column({ default: false })
    acceptsRides: boolean;

    // Cumulative courier stats
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalEarnings: number;

    @Column({ default: 0 })
    completedDeliveries: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
    courierRating: number;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    lastLat: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    lastLng: number;

    @Index({ spatial: true })
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    location: string;

    // --- Privacy & Legal (Ley 8968) ---
    @Column({ default: false })
    agreedToPrivacyPolicy: boolean;

    @Column({ nullable: true })
    privacyPolicyAgreedAt: Date;

    @Column({ nullable: true })
    privacyPolicyVersion: string;

    @Column({ default: false })
    isEmailVerified: boolean;

    @Column({ nullable: true })
    emailVerificationToken: string;

    @Column({ nullable: true })
    passwordResetToken: string;

    @Column({ nullable: true })
    passwordResetExpires: Date;

    @Column({ nullable: true, select: false })
    currentRefreshTokenHash: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    fcmToken: string;
}
