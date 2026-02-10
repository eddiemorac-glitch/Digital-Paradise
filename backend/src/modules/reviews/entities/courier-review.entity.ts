import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('courier_reviews')
export class CourierReview {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    rating: number; // 1-5

    @Column({ type: 'text', nullable: true })
    comment: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'clientId' })
    client: User;

    @Column()
    clientId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'courierId' })
    courier: User;

    @Column()
    courierId: string;

    @OneToOne(() => Order)
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column()
    orderId: string;

    @CreateDateColumn()
    createdAt: Date;
}
