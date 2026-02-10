const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'caribe_digital',
    password: 'sentinel2024',
    port: 5432,
});

async function checkHealth() {
    try {
        await client.connect();
        console.log('✅ Connected to database for Health Check.');

        // 1. Audit Merchants
        console.log('\n🏥 --- MERCHANT AUDIT ---');
        const totalMerchants = await client.query('SELECT count(*) FROM merchants');
        console.log(`Total Merchants: ${totalMerchants.rows[0].count}`);

        const badMerchants = await client.query(`
            SELECT id, name, latitude, longitude 
            FROM merchants 
            WHERE latitude IS NULL OR longitude IS NULL 
               OR latitude = 0 OR longitude = 0
               OR latitude::text = 'NaN' OR longitude::text = 'NaN'
        `);

        if (badMerchants.rowCount === 0) {
            console.log('✅ All Merchants have valid coordinates.');
        } else {
            console.log(`⚠️ Found ${badMerchants.rowCount} merchants with invalid coordinates:`);
            badMerchants.rows.forEach(m => console.log(`   - ${m.name} (${m.latitude}, ${m.longitude})`));
        }

        // 2. Audit Missions
        console.log('\n📦 --- MISSION AUDIT ---');
        const totalMissions = await client.query('SELECT count(*) FROM logistics_missions');
        console.log(`Total Missions: ${totalMissions.rows[0].count}`);

        const badMissions = await client.query(`
            SELECT id, "originLat", "originLng", "orderId"
            FROM logistics_missions 
            WHERE "originLat" IS NULL OR "originLng" IS NULL 
               OR "originLat" = 0 OR "originLng" = 0
               OR "originLat"::text = 'NaN' OR "originLng"::text = 'NaN'
        `);

        if (badMissions.rowCount === 0) {
            console.log('✅ All Missions have valid origin coordinates.');
        } else {
            console.log(`⚠️ Found ${badMissions.rowCount} missions with invalid origin coordinates:`);
            badMissions.rows.forEach(m => console.log(`   - Mission ${m.id}`));
        }

    } catch (err) {
        console.error('❌ Error during health check:', err);
    } finally {
        await client.end();
    }
}

checkHealth();
