const axios = require('axios');

async function debugOrder() {
    const baseUrl = 'http://localhost:3000';
    try {
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'admin@caribe.com',
            password: 'admin123'
        });
        const token = loginRes.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };

        const orderData = {
            merchantId: '2b895fbc-16bc-452f-8706-e75818147581',
            items: [{ productId: '6948fd60-29c4-42b7-a352-75818147581a', quantity: 1 }], // Added an 'a' at end just in case ID was off
            customerNotes: 'Manual debug note',
            courierTip: 500
        };

        // Try to find real IDs first to be 100% sure
        const merchants = await axios.get(`${baseUrl}/merchants`, { headers });
        if (merchants.data.length > 0) {
            orderData.merchantId = merchants.data[0].id;
            const products = await axios.get(`${baseUrl}/products/merchant/${orderData.merchantId}`, { headers });
            if (products.data.length > 0) {
                orderData.items[0].productId = products.data[0].id;
            }
        }

        console.log('Sending Order Request:', JSON.stringify(orderData, null, 2));
        const orderRes = await axios.post(`${baseUrl}/orders`, orderData, { headers });
        console.log('UNEXPECTED SUCCESS:', orderRes.data);

    } catch (err) {
        if (err.response) {
            console.log('ERROR STATUS:', err.response.status);
            console.log('ERROR BODY:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('ERROR:', err.message);
        }
    }
}

debugOrder();
