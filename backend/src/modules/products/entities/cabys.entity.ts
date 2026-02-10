import { Entity, PrimaryColumn, Column, CreateDateColumn, BaseEntity } from 'typeorm';
import { NumericTransformer } from '../../../shared/utils/numeric-transformer';


@Entity('cabys')
export class Cabys extends BaseEntity {
    @PrimaryColumn({ length: 13 })
    codigo: string;

    @Column({ type: 'text' })
    descripcion: string;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 13.00,
        transformer: new NumericTransformer()
    })
    impuesto: number;

    @Column({ type: 'text', nullable: true })
    categoria: string;

    @CreateDateColumn()
    createdAt: Date;
}
