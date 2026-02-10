const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'caribe_digital',
    password: 'sentinel2024',
    port: 5432,
});

async function heal() {
    try {
        await client.connect();
        console.log('✅ Connected to database.');

        // 1. Find the Problem Mission (NaN or null coordinates)
        console.log('🔍 Searching for missions with invalid coordinates...');
        const problemMissions = await client.query(`
            SELECT m.id, m."originLat", m."originLng", m."orderId", o."merchantId", merch.name as merchant_name
            FROM logistics_missions m
            LEFT JOIN orders o ON m."orderId" = o.id
            LEFT JOIN merchants merch ON o."merchantId" = merch.id
            WHERE m."originLat"::text = 'NaN' OR m."originLat" IS NULL OR m."originLat" = 0
        `);

        console.log(`⚠️ Found ${problemMissions.rowCount} problem missions.`);

        for (const prob of problemMissions.rows) {
            console.log(`   - Mission ${prob.id} (Merchant: ${prob.merchant_name || 'UNKNOWN'})`);
            console.log(`     Data: Lat=${prob.originLat}, Lng=${prob.originLng}, Order=${prob.orderId}, MerchantID=${prob.merchantId}`);

            if (prob.merchantId) {
                // Heal this specific mission using its merchant's coordinates
                // First get merchant coords
                const merchRes = await client.query(`SELECT latitude, longitude FROM merchants WHERE id = $1`, [prob.merchantId]);
                const merch = merchRes.rows[0];

                if (merch && merch.latitude && merch.latitude !== 0) {
                    console.log(`   🩹 Healing with verified merchant coords: ${merch.latitude}, ${merch.longitude}`);
                    await client.query(`
                        UPDATE logistics_missions
                        SET "originLat" = $1, "originLng" = $2
                        WHERE id = $3
                    `, [merch.latitude, merch.longitude, prob.id]);
                    console.log('   ✅ FIXED!');
                } else {
                    console.log('   ❌ Merchant also has invalid coordinates! Setting to Puerto Viejo default.');
                    // Default
                    await client.query(`
                        UPDATE logistics_missions
                        SET "originLat" = 9.6550, "originLng" = -82.7530
                        WHERE id = $1
                    `, [prob.id]);
                    console.log('   ✅ FIXED to Default!');
                }
            } else {
                console.log('   ❌ No Merchant ID linked! Cannot heal properly.');
            }
        }

    } catch (err) {
        console.error('❌ Error healing:', err);
    } finally {
        await client.end();
    }
}

heal();
