
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'caribe_digital',
    synchronize: false,
    logging: true,
    entities: [],
    subscribers: [],
    migrations: [],
});

async function testConnection() {
    console.log('Testing DB Connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`User: ${process.env.DB_USERNAME}`);
    console.log(`DB: ${process.env.DB_NAME}`);

    try {
        await AppDataSource.initialize();
        console.log('✅ Data Source has been initialized!');
        await AppDataSource.destroy();
    } catch (err) {
        console.error('❌ Error during Data Source initialization', err);
    }
}

testConnection();
