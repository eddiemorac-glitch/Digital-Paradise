const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'caribe_digital',
    password: 'sentinel2024',
    port: 5432,
});

async function healAll() {
    try {
        await client.connect();
        console.log('✅ Connected to database for Global Heal.');

        // 1. Heal Merchants
        console.log('\n🏥 --- HEALING MERCHANTS ---');
        // Find merchants with bad coords
        const badMerchants = await client.query(`
            SELECT id, name FROM merchants 
            WHERE latitude IS NULL OR longitude IS NULL 
               OR latitude = 0 OR longitude = 0
               OR latitude::text = 'NaN' OR longitude::text = 'NaN'
        `);

        if (badMerchants.rowCount > 0) {
            console.log(`Found ${badMerchants.rowCount} merchants to heal.`);
            for (const m of badMerchants.rows) {
                console.log(`   - Healing ${m.name} -> Defaulting to Puerto Viejo Center`);
                await client.query(`
                    UPDATE merchants 
                    SET latitude = 9.6550, longitude = -82.7530 
                    WHERE id = $1
                `, [m.id]);
            }
        } else {
            console.log('✅ All merchants OK.');
        }

        // 2. Heal Missions (Sync with Merchants)
        console.log('\n📦 --- HEALING MISSIONS ---');
        // Find missions with bad coords
        const badMissions = await client.query(`
            SELECT m.id, m."orderId", o."merchantId"
            FROM logistics_missions m
            JOIN orders o ON m."orderId" = o.id
            WHERE m."originLat" IS NULL OR m."originLng" IS NULL 
               OR m."originLat" = 0 OR m."originLng" = 0
               OR m."originLat"::text = 'NaN' OR m."originLng"::text = 'NaN'
        `);

        if (badMissions.rowCount > 0) {
            console.log(`Found ${badMissions.rowCount} missions to heal.`);
            for (const m of badMissions.rows) {
                if (m.merchantId) {
                    // Get current merchant coords (which should be healed now)
                    const merchRes = await client.query('SELECT latitude, longitude FROM merchants WHERE id = $1', [m.merchantId]);
                    const merch = merchRes.rows[0];

                    if (merch && merch.latitude) {
                        console.log(`   - Syncing Mission ${m.id} to Merchant Coords (${merch.latitude}, ${merch.longitude})`);
                        await client.query(`
                            UPDATE logistics_missions
                            SET "originLat" = $1, "originLng" = $2
                            WHERE id = $3
                         `, [merch.latitude, merch.longitude, m.id]);
                    } else {
                        console.warn(`   ⚠️ Merchant for Mission ${m.id} still has bad coords!`);
                    }
                }
            }
        } else {
            console.log('✅ All missions OK.');
        }

    } catch (err) {
        console.error('❌ Error during global heal:', err);
    } finally {
        await client.end();
    }
}

healAll();
