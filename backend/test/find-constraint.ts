
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function findConstraint() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    try {
        const result = await dataSource.query(`
            SELECT 
                conname as constraint_name,
                conrelid::regclass as table_name,
                pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conname = 'UQ_f125672f13f9d234c6696db2201';
        `);
        console.log('--- CONSTRAINT TARGET ---\n' + JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        await app.close();
    }
}

findConstraint();
