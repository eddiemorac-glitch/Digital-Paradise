import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, OneToOne, BaseEntity, Index } from 'typeorm';
import { NumericTransformer } from '../../../shared/utils/numeric-transformer';

import { User } from '../../users/entities/user.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from '../../../shared/enums/order-status.enum';
import { DisputeStatus } from '../../../shared/enums/dispute-status.enum';
import { Review } from '../../reviews/entities/review.entity';
import { LogisticsMission } from '../../logistics/entities/logistics-mission.entity';

@Entity('orders')
@Index('IDX_orders_userId', ['userId'])
@Index('IDX_orders_merchantId', ['merchantId'])
@Index('IDX_orders_status', ['status'])
@Index('IDX_orders_deliveryId', ['deliveryId'])
@Index('IDX_orders_paymentStatus', ['paymentStatus'])
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new NumericTransformer()
    })
    subtotal: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new NumericTransformer()
    })
    tax: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new NumericTransformer()
    })
    transactionFee: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        transformer: new NumericTransformer()
    })
    total: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new NumericTransformer()
    })
    deliveryFee: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new NumericTransformer()
    })
    platformFee: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new NumericTransformer()
    })
    courierEarnings: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Merchant, { nullable: false })
    @JoinColumn({ name: 'merchantId' })
    merchant: Merchant;

    @Column()
    merchantId: string;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'deliveryId' })
    deliveryPerson: User;

    @Column({ nullable: true })
    deliveryId: string;

    @Column({ nullable: true })
    deliveryAddress: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 8,
        nullable: true,
        transformer: new NumericTransformer()
    })
    deliveryLat: number;

    @Column({
        type: 'decimal',
        precision: 11,
        scale: 8,
        nullable: true,
        transformer: new NumericTransformer()
    })
    deliveryLng: number;

    @OneToOne(() => Review, (review) => review.order)
    review: Review;

    @OneToOne(() => LogisticsMission, (mission) => mission.order)
    logisticsMission: LogisticsMission;

    // Hacienda & Electronic Invoicing (Phase 4)
    @Column({ length: 50, nullable: true })
    haciendaKey: string; // La "Clave Numérica" de 50 dígitos

    @Column({ length: 20, nullable: true })
    electronicSequence: string; // El "Consecutivo"

    @Column({ default: false })
    isElectronicInvoice: boolean;

    @Column({ type: 'text', nullable: true })
    customerNotes: string;

    @Column({ default: 'PENDING' })
    paymentStatus: string; // PENDING, PAID, FAILED

    @Column({ nullable: true })
    transactionId: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new NumericTransformer()
    })
    courierTip: number;

    // ==================== DISPUTE HANDLING ====================
    @Column({ type: 'enum', enum: DisputeStatus, nullable: true })
    disputeStatus: DisputeStatus;

    @Column({ type: 'text', nullable: true })
    disputeReason: string;

    @Column({ nullable: true })
    disputeResolvedBy: string; // adminUserId who resolved

    @Column({ nullable: true })
    disputeResolvedAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Column({ type: 'jsonb', nullable: true })
    statusHistory: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
