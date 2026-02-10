import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('passkeys')
export class Passkey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    credentialID: string;

    @Column({ type: 'bytea' })
    publicKey: Buffer;

    @Column()
    counter: number;

    @Column()
    deviceType: string;

    @Column()
    backedUp: boolean;

    @Column({ type: 'text' })
    transports: string; // Stored as comma separated string

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
