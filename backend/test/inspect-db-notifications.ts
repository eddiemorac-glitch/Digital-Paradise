
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function inspectDb() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    try {
        const columns = await dataSource.query(`
            SELECT column_name, data_type, udt_name, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'notifications';
        `);
        console.log('--- COLUMNS (Notifications) ---\n' + JSON.stringify(columns, null, 2));

        const constraints = await dataSource.query(`
            SELECT conname, contype, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'notifications'::regclass;
        `);
        console.log('\n--- CONSTRAINTS (Notifications) ---\n' + JSON.stringify(constraints, null, 2));

    } catch (error) {
        console.error('Inspection failed:', error);
    } finally {
        await app.close();
    }
}

inspectDb();
