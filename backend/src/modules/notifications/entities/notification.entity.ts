import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
    INFO = 'info',
    ECO = 'eco',
    SYSTEM = 'system',
    ORDER = 'order',
    SUCCESS = 'success',
    PROMO = 'promo'
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.INFO
    })
    type: NotificationType;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    userId: string; // If null, it's a broadcast notification for everyone

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    actionLink: string; // Optional link to redirect user (e.g. /events/1)

    @CreateDateColumn()
    createdAt: Date;
}
