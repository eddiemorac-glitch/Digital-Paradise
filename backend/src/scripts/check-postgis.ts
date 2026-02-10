
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function checkPostGIS() {
    await dataSource.initialize();
    try {
        const result = await dataSource.query("SELECT * FROM pg_extension WHERE extname = 'postgis';");
        console.log('PostGIS Status:', result.length > 0 ? 'ENABLED' : 'DISABLED');
        if (result.length === 0) {
            console.log('Attempting to enable PostGIS...');
            await dataSource.query("CREATE EXTENSION IF NOT EXISTS postgis;");
            console.log('PostGIS ENABLED successfully.');
        }
    } catch (e) {
        console.error('Error checking PostGIS:', e);
    } finally {
        await dataSource.destroy();
    }
}

checkPostGIS();
