const axios = require('axios');

async function debugMissions() {
    try {
        console.log('🐢 Logging in as ADMIN...');
        const loginRes = await axios.post('http://localhost:3005/auth/login', {
            email: 'admin@caribe.com',
            password: 'admin123'
        });

        const token = loginRes.data.access_token;
        console.log('✅ Logged in as Admin!');

        console.log('📦 Fetching ALL missions...');
        const missionsRes = await axios.get('http://localhost:3005/logistics/admin/missions', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('📋 Missions Found:', missionsRes.data.length);
        for (const m of missionsRes.data) {
            console.log('---------------------------------------');
            console.log(`Mission ID: ${m.id}`);

            if (m.originLat === 'NaN' || isNaN(Number(m.originLat)) || m.originLat === 0) {
                console.log('⚠️ PROBLEM MISSION DETECTED!');
                console.log('Full Mission Object:', JSON.stringify(m, null, 2));

                if (m.order && m.order.merchant) {
                    console.log(`🚨 MERCHANT: ${m.order.merchant.name} (ID: ${m.order.merchant.id})`);
                } else {
                    console.log('🚨 MERCHANT INFO MISSING IN RELATION!');
                }
            } else {
                console.log('✅ Mission seems OK.');
            }
        }

    } catch (error) {
        console.error('❌ Error Details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status
        });
    }
}

debugMissions();
