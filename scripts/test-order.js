const axios = require('axios');

async function testOrder() {
    const baseUrl = 'http://localhost:3000';
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'admin@caribe.com',
            password: 'admin123'
        });
        const token = loginRes.data.access_token;
        console.log('Login successful');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get Merchants
        console.log('Fetching merchants...');
        const merchantsRes = await axios.get(`${baseUrl}/merchants`, { headers });
        const merchant = merchantsRes.data[0];
        if (!merchant) throw new Error('No merchants found');
        console.log(`Found merchant: ${merchant.name} (${merchant.id})`);

        // 3. Get Products for merchant
        console.log('Fetching products...');
        const productsRes = await axios.get(`${baseUrl}/products/merchant/${merchant.id}`, { headers });
        const product = productsRes.data[0];
        if (!product) throw new Error('No products found for merchant');
        console.log(`Found product: ${product.name} (${product.id})`);

        // 4. Create Order
        console.log('Creating order...');
        const orderData = {
            merchantId: merchant.id,
            items: [{ productId: product.id, quantity: 1 }],
            customerNotes: 'Test order notes',
            courierTip: 500
        };

        try {
            const orderRes = await axios.post(`${baseUrl}/orders`, orderData, { headers });
            console.log('Order created successfully:', orderRes.data);
        } catch (err) {
            console.error('Order creation FAILED');
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.error('Error:', err.message);
            }
        }

    } catch (err) {
        console.error('Test FAILED:', err.message);
        if (err.response) console.error('Data:', err.response.data);
    }
}

testOrder();
