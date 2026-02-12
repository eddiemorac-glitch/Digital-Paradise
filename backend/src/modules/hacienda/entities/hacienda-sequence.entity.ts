import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('hacienda_sequences')
@Unique(['merchantId', 'documentType', 'terminal', 'puntoVenta'])
export class HaciendaSequence {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    merchantId: string;

    @Column({ length: 2 })
    documentType: string; // '01' factura, '03' tiquete, etc.

    @Column({ length: 3, default: '001' })
    terminal: string;

    @Column({ length: 5, default: '00001' })
    puntoVenta: string;

    @Column({ type: 'bigint', default: 1 })
    currentValue: number;

    @UpdateDateColumn()
    updatedAt: Date;
}
