
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

async function debugBounds() {
    await dataSource.initialize();
    console.log('🔍 Debugging Bounds Query...');

    // Test values for Puerto Viejo
    const minLat = 9.0;
    const maxLat = 10.0;
    const minLng = -83.0;
    const maxLng = -82.0;

    try {
        const query = `
            SELECT id, title FROM events 
            WHERE "isActive" = true 
            AND location && ST_MakeEnvelope($1, $2, $3, $4, 4326);
        `;
        const result = await dataSource.query(query, [minLng, minLat, maxLng, maxLat]);
        console.log('Query Result:', result);
    } catch (e) {
        console.error('❌ Query Failed:', e.message);
        console.log('Trying alternative (ST_Intersects cast to geometry)...');
        try {
            const query2 = `
                SELECT id, title FROM events 
                WHERE "isActive" = true 
                AND ST_Intersects(location::geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326));
            `;
            const result2 = await dataSource.query(query2, [minLng, minLat, maxLng, maxLat]);
            console.log('Query 2 Result:', result2);
        } catch (e2) {
            console.error('❌ Query 2 Failed:', e2.message);
        }
    } finally {
        await dataSource.destroy();
    }
}

debugBounds();
