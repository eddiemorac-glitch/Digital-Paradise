import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BaseEntity, Index } from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Cabys } from './cabys.entity';

import { NumericTransformer } from '../../../shared/utils/numeric-transformer';

@Entity('products')
export class Product extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        transformer: new NumericTransformer(),
    })
    price: number;

    @Column({ nullable: true })
    imageUrl: string;

    @Index()
    @Column({ default: true })
    isAvailable: boolean;

    @Column({ default: false })
    isPopular: boolean;

    @Column({ default: false })
    isEco: boolean;

    @Index()
    @Column({ nullable: true })
    category: string; // e.g., 'Entradas', 'Platos Fuertes', 'Bebidas'

    @Index()
    @Column({ length: 13, nullable: true })
    cabysCode: string;

    @Column({ type: 'jsonb', nullable: true })
    optionsMetadata: {
        name: string;
        required: boolean;
        maxSelections?: number;
        values: { name: string; addPrice: number }[];
    }[];

    @ManyToOne(() => Cabys, { nullable: true })
    @JoinColumn({ name: 'cabysCode', referencedColumnName: 'codigo' })
    cabys: Cabys;

    @ManyToOne(() => Merchant, (merchant) => merchant.products, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchantId' })
    merchant: Merchant;

    @Index()
    @Column()
    merchantId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
