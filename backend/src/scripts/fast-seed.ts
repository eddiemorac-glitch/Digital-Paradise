
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

async function fastSeed() {
    await dataSource.initialize();
    console.log('🚀 Starting Fast SQL Seed...');

    try {
        // Clean up existing events to avoid conflicts
        await dataSource.query("DELETE FROM events;");

        const now = new Date().toISOString();
        const tomorrow = new Date(Date.now() + 86400000).toISOString();
        const nextWeek = new Date(Date.now() + 604800000).toISOString();

        const sql = `
            INSERT INTO events (
                id, title, description, date, time, "startDate", 
                "locationName", venue, latitude, longitude, 
                location, category, type, "adTier", "adSize", 
                attendees, "isEcoFriendly", "isActive", 
                price, currency, "maxCapacity", "soldTickets",
                "createdAt", "updatedAt"
            ) VALUES 
            (
                gen_random_uuid(), 'Antigravity Neural Rave', 'Fiesta psicodélica y tecnológica en la selva.', 
                'Hoy, 10:00 PM', '22:00', '${now}', 
                'Puerto Viejo', 'Salsa Brava', 9.6558, -82.7538, 
                ST_SetSRID(ST_Point(-82.7538, 9.6558), 4326)::geography, 
                'nightlife', 'fire', 'GOLD', 'LARGE', 
                250, true, true, 
                15000, 'CRC', 500, 0,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ),
            (
                gen_random_uuid(), 'Fuego en la Playa', 'Música en vivo y fogata comunitaria.', 
                'Mañana, 8:00 PM', '20:00', '${tomorrow}', 
                'Playa Cocles', 'Jaguar Inn', 9.6458, -82.7338, 
                ST_SetSRID(ST_Point(-82.7338, 9.6458), 4326)::geography, 
                'concert', 'reggae', 'SILVER', 'MEDIUM', 
                120, false, true, 
                7500, 'CRC', 200, 0,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ),
            (
                gen_random_uuid(), 'Mercado del Mar', 'Artesanías y productos orgánicos.', 
                'Próximo Sábado', '09:00', '${nextWeek}', 
                'Puerto Viejo Centro', 'Parque Central', 9.6578, -82.7558, 
                ST_SetSRID(ST_Point(-82.7558, 9.6578), 4326)::geography, 
                'culture', 'art', 'BRONZE', 'SMALL', 
                50, true, true, 
                0, 'CRC', 0, 0,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        `;

        await dataSource.query(sql);
        console.log('✅ Fast Seed Successful!');
    } catch (e) {
        console.error('❌ Fast Seed Failed:', e);
    } finally {
        await dataSource.destroy();
    }
}

fastSeed();
