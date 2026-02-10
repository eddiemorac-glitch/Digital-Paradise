const { Client } = require('pg');

async function fixDb() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'caribe_digital_v2',
        password: 'caribe_master_2026',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const res = await client.query(`
            UPDATE merchants 
            SET "userId" = (SELECT id FROM users WHERE email = 'comercio@caribe.com') 
            WHERE name = 'Bread and Chocolate' AND "userId" IS NULL;
        `);

        console.log(`Updated ${res.rowCount} rows`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

fixDb();
