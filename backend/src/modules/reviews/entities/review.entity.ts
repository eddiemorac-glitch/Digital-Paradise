import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    rating: number; // 1-5

    @Column({ type: 'text', nullable: true })
    comment: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Merchant)
    @JoinColumn({ name: 'merchantId' })
    merchant: Merchant;

    @Column()
    merchantId: string;

    @OneToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column({ nullable: true })
    orderId: string;

    @CreateDateColumn()
    createdAt: Date;
}
