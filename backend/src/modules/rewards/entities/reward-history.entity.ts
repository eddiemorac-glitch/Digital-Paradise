import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('reward_history')
@Index(['userId', 'orderId'], { unique: true })
export class RewardHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    orderId: string;

    @Column()
    points: number;

    @Column({ nullable: true })
    reason: string;

    @ManyToOne(() => User)
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}
