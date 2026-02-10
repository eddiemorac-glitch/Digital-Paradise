const axios = require('axios');
require('dotenv').config({ path: 'backend/.env' });

async function testTilopay() {
    const config = {
        apiKey: process.env.TILOPAY_API_KEY,
        apiUser: process.env.TILOPAY_API_USER,
        apiPassword: process.env.TILOPAY_API_PASSWORD,
        sandbox: process.env.TILOPAY_SANDBOX === 'true'
    };

    console.log('Testing Tilopay with config:', { ...config, apiPassword: '***' });

    const baseUrl = 'https://app.tilopay.com/api/v1';
    const endpoints = ['/buttonPayment', '/getPaymentToken', '/processSdk', '/payments'];

    for (const endpoint of endpoints) {
        console.log(`\nTesting endpoint: ${endpoint}`);
        try {
            const response = await axios.post(`${baseUrl}${endpoint}`, {
                apikey: config.apiKey,
                apiuser: config.apiUser,
                apipassword: config.apiPassword,
                orderNumber: 'TEST-' + Date.now(),
                amount: '100.00',
                currency: 'CRC',
                redirect: 'http://localhost:5173/payment/callback'
            }, { timeout: 10000 });
            console.log('Success!', response.status, JSON.stringify(response.data, null, 2));
        } catch (err) {
            console.log('Error:', err.response?.status, err.response?.data || err.message);
        }
    }
}

testTilopay();
