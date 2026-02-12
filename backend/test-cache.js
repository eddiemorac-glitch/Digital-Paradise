const axios = require('axios');

const API_URL = 'https://digital-paradise.onrender.com/api'; // Adjust if testing locally: http://localhost:3001/api

async function measureRequest(label, url) {
    const start = Date.now();
    try {
        await axios.get(url);
        const duration = Date.now() - start;
        console.log(`[${label}] Request took ${duration}ms`);
        return duration;
    } catch (error) {
        console.error(`[${label}] Failed: ${error.message}`);
        return null;
    }
}

async function testCache() {
    console.log('🚀 Testing API Caching for Merchants Endpoint...');
    const url = `${API_URL}/merchants`;

    // First request (Cache Miss)
    const time1 = await measureRequest('First Hit (Miss)', url);

    // Second request (Cache Hit)
    const time2 = await measureRequest('Second Hit (Hit)', url);

    if (time1 && time2) {
        const improvement = time1 - time2;
        console.log(`\n✅ Improvement: ${improvement}ms faster`);
        if (time2 < time1 * 0.5) {
            console.log('🌟 Caching is WORKING properly! (Significant speedup)');
        } else {
            console.log('⚠️ Caching might not be active or network variance is high.');
        }
    }
}

testCache();
