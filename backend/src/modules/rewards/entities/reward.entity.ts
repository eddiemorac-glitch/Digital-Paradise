import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RewardType {
    DISCOUNT = 'discount',
    FREE_PRODUCT = 'free_product',
    DONATION = 'donation',
    GIFT_CARD = 'gift_card'
}

@Entity('rewards')
export class Reward {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'enum', enum: RewardType })
    type: RewardType;

    @Column()
    pointCost: number;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    merchantId: string; // Optional: Reward could be specific to a merchant

    @CreateDateColumn()
    createdAt: Date;
}

@Entity('user_redemptions')
export class UserRedemption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    rewardId: string;

    @ManyToOne(() => Reward)
    @JoinColumn({ name: 'rewardId' })
    reward: Reward;

    @Column({ nullable: true })
    code: string; // The generated coupon code

    @Column({ default: false })
    isUsed: boolean;

    @CreateDateColumn()
    redeemedAt: Date;
}
