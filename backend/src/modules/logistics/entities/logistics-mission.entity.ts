import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { MissionType } from '../../../shared/enums/mission-type.enum';
import { OrderStatus } from '../../../shared/enums/order-status.enum';

@Entity('logistics_missions')
export class LogisticsMission extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: MissionType,
        default: MissionType.FOOD_DELIVERY,
    })
    type: MissionType;

    @ManyToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column({ nullable: true })
    orderId: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'clientId' })
    client: User;

    @Column()
    clientId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'courierId' })
    courier: User;

    @Column({ nullable: true })
    courierId: string;

    @Column({ nullable: true })
    merchantId: string;

    // Origins and Destinies (Polymorphic)
    @Column({ type: 'text' })
    originAddress: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    originLat: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    originLng: number;

    @Column({ type: 'text' })
    destinationAddress: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    destinationLat: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    destinationLng: number;

    // Distance tracking
    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    estimatedDistanceKm: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    actualDistanceKm: number;

    // Price and estimated time
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    estimatedPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    courierEarnings: number;

    @Column({ type: 'int', nullable: true })
    estimatedMinutes: number;

    // Delivery lifecycle timestamps
    @Column({ nullable: true })
    pickedUpAt: Date;

    @Column({ nullable: true })
    completedAt: Date;

    // Generic Metadata for specific mission types
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
