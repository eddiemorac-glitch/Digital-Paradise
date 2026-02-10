
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { Cabys } from '../modules/products/entities/cabys.entity';

async function seedCabys() {
    console.log('🌱 Seeding CABYS Stub Data...');

    const config = {
        ...typeOrmConfig,
        host: 'localhost', // Force localhost for script
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    const dataSource = new DataSource(config as any);
    await dataSource.initialize();

    try {
        const cabysRepo = dataSource.getRepository(Cabys);

        const data = [
            { codigo: '2311000000000', descripcion: 'Servicios de comida y bebida en restaurantes', impuesto: 13.00, categoria: 'Servicios' },
            { codigo: '2399000000000', descripcion: 'Otros servicios de alimentación', impuesto: 13.00, categoria: 'Servicios' },
            { codigo: '0111100000000', descripcion: 'Arroz procesado (blanco o integral)', impuesto: 1.00, categoria: 'Alimentos' },
            { codigo: '0111200000000', descripcion: 'Frijoles negros preparados', impuesto: 1.00, categoria: 'Alimentos' },
            { codigo: '2312000000000', descripcion: 'Servicios de bebidas alcohólicas para consumo inmediato', impuesto: 10.00, categoria: 'Bebidas' },
            { codigo: '0112000000000', descripcion: 'Plátanos frescos', impuesto: 1.00, categoria: 'Alimentos' }
        ];

        for (const item of data) {
            const exists = await cabysRepo.findOne({ where: { codigo: item.codigo } });
            if (!exists) {
                await cabysRepo.save(cabysRepo.create(item));
                console.log(`✅ Added: ${item.descripcion}`);
            } else {
                console.log(`ℹ️ Skipped: ${item.descripcion} (Already exists)`);
            }
        }

        console.log('✨ CABYS Seeding Completed');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

seedCabys();
