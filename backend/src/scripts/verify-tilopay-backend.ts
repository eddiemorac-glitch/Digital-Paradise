
import axios from 'axios';

const API_URL = 'http://localhost:3005/api';
// Use the dev admin account or creating a fresh customer would be better, but admin works for testing
const EMAIL = 'admin@caribedigital.cr';
const PASSWORD = 'CaribeMaximumSecurity2026!';

async function verifyBackend() {
    console.log('🚀 Starting Backend Verification for Tilopay...');

    try {
        // 1. Login
        console.log(`\n🔑 Logging in as ${EMAIL}...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.access_token;
        console.log('✅ Login successful.');

        // 2. Find existing order
        console.log('\n📦 Fetching orders...');
        // Correct endpoint is /orders for user's orders
        const ordersRes = await axios.get(`${API_URL}/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        let orderId;
        if (ordersRes.data && ordersRes.data.length > 0) {
            orderId = ordersRes.data[0].id;
            console.log(`✅ Found existing order: ${orderId}`);
        } else {
            console.log('⚠️ No orders found. Creating a test order...');

            // 2a. Find a merchant
            const merchantsRes = await axios.get(`${API_URL}/merchants?isActive=true`);
            if (!merchantsRes.data || merchantsRes.data.length === 0) {
                throw new Error('No active merchants found to create an order.');
            }
            const merchant = merchantsRes.data[0];
            console.log(`   Selected Merchant: ${merchant.name} (${merchant.id})`);

            // 2b. Find a product
            const productsRes = await axios.get(`${API_URL}/products/merchant/${merchant.id}`);
            if (!productsRes.data || productsRes.data.length === 0) {
                throw new Error('Merchant has no products.');
            }
            const product = productsRes.data[0];
            console.log(`   Selected Product: ${product.name} (${product.id})`);

            // 2c. Create Order
            const createOrderRes = await axios.post(`${API_URL}/orders`, {
                merchantId: merchant.id,
                items: [{
                    productId: product.id,
                    quantity: 1
                }],
                deliveryAddress: 'Test Address for Tilopay Verification',
                deliveryLat: 9.65,
                deliveryLng: -82.75
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            orderId = createOrderRes.data.id;
            console.log(`✅ Created new test order: ${orderId}`);
        }

        // 3. Request Tilopay Token
        console.log(`\n💳 Requesting Tilopay Token for Order ${orderId}...`);

        // We verify the order details just to be sure
        const orderRes = await axios.get(`${API_URL}/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const orderAmount = orderRes.data.total;
        console.log(`   Order Total: ₡${orderAmount / 100}`);

        const tokenRes = await axios.post(`${API_URL}/payments/tilopay-token`, {
            orderId: orderId,
            amount: orderAmount || 15000,
            currency: 'CRC'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('\n🔍 Token Response Data:', JSON.stringify(tokenRes.data, null, 2));

        if (tokenRes.data.token && tokenRes.data.success) {
            console.log('\n✅ SUCCESS: Tilopay Token generated successfully.');
            console.log(`   Token: ${tokenRes.data.token.substring(0, 20)}...`);
            console.log(`   Environment: ${tokenRes.data.environment}`);
        } else {
            console.error('\n❌ FAILURE: Token missing or success false.');
        }

    } catch (error: any) {
        console.error('\n❌ Error during verification:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

verifyBackend();
