
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function inspectDb() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    try {
        console.log('--- Inspecting Events Table ---');
        const columns = await dataSource.query(`
            SELECT column_name, data_type, udt_name, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'events';
        `);
        console.table(columns);

        console.log('\n--- Inspecting Triggers on Events ---');
        const triggers = await dataSource.query(`
            SELECT trigger_name, event_manipulation, event_object_table, action_statement, action_timing
            FROM information_schema.triggers
            WHERE event_object_table = 'events';
        `);
        console.table(triggers);

        console.log('\n--- Inspecting Constraints on Events ---');
        const constraints = await dataSource.query(`
            SELECT conname, contype, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'events'::regclass;
        `);
        console.table(constraints);

    } catch (error) {
        console.error('Inspection failed:', error);
    } finally {
        await app.close();
    }
}

inspectDb();
