import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from './merchant.entity';
import { User } from '../../users/entities/user.entity';

@Entity('merchant_action_logs')
export class MerchantActionLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    merchantId: string;

    @ManyToOne(() => Merchant)
    @JoinColumn({ name: 'merchantId' })
    merchant: Merchant;

    @Column()
    adminUserId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'adminUserId' })
    adminUser: User;

    @Column()
    action: string; // e.g., 'APPROVE', 'REJECT', 'SUSPEND', 'REACTIVATE'

    @Column({ type: 'text', nullable: true })
    reason: string;

    @Column({ type: 'jsonb', nullable: true })
    previousState: any;

    @Column({ type: 'jsonb', nullable: true })
    newState: any;

    @CreateDateColumn()
    createdAt: Date;
}
