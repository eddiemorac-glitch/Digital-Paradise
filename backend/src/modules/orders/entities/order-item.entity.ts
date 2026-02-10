import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column()
    orderId: string;

    @ManyToOne(() => Product, { nullable: true })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ nullable: true })
    productId: string;

    @ManyToOne(() => Event, { nullable: true })
    @JoinColumn({ name: 'eventId' })
    event: Event;

    @Column({ nullable: true })
    eventId: string;

    @ManyToOne('EventRequest', { nullable: true })
    @JoinColumn({ name: 'eventRequestId' })
    eventRequest: any; // Using any to avoid circular dependency import issues for now, or use forwardRef if Entity

    @Column({ nullable: true })
    eventRequestId: string;

    @Column({ type: 'jsonb', nullable: true })
    selectedOptions: {
        optionName: string;
        valueName: string;
        addPrice: number;
    }[];

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number; // Snapshot of price at purchase time

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    impuesto: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total: number;
}
