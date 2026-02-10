const { execSync } = require('child_process');
const path = require('path');

const API_URL = 'http://127.0.0.1:3003';

async function testMerchantFlow() {
    try {
        console.log('--- MERCHANT FLOW TEST (built-in fetch) ---');

        // 1. Register a Merchant user
        console.log('Registering merchant user...');
        const merchantEmail = `merchant_${Date.now()}@test.com`;
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: merchantEmail,
                password: 'password123',
                fullName: 'Eddie Merchant',
                agreedToPrivacyPolicy: true,
                privacyPolicyVersion: 'v1.0'
            })
        });

        const registerData = await registerRes.json();
        if (!registerRes.ok) throw new Error(`Register failed: ${JSON.stringify(registerData)}`);

        let token = registerData.access_token;
        const userId = registerData.user.id;
        console.log('Merchant User Registered:', userId);

        // 2. Upgrade user to merchant in DB
        console.log(`Upgrading user ${merchantEmail} via python script...`);
        const upgradeScript = path.join(__dirname, 'upgrade_user.py');
        const output = execSync(`python "${upgradeScript}" "${merchantEmail}" "Soda Lidia"`, { encoding: 'utf-8' });
        console.log('Python Output:', output);

        // 3. Login again to get token with new role
        console.log('Re-logging to refresh role...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: merchantEmail,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        token = loginData.access_token;
        console.log('New Token with MERCHANT role acquired.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 4. Get Soda Lidia ID
        console.log('Fetching Soda Lidia ID...');
        const merchantsRes = await fetch(`${API_URL}/merchants`);
        const responseBody = await merchantsRes.json();
        const merchants = Array.isArray(responseBody) ? responseBody : responseBody.data;
        const sodaLidia = merchants.find(m => m.name.trim().toLowerCase() === 'soda lidia');

        if (!sodaLidia) {
            throw new Error(`Soda Lidia not found in: ${merchants.map(m => m.name).join(', ')}`);
        }

        console.log('Creating a test order for Soda Lidia...');
        const productsRes = await fetch(`${API_URL}/products/merchant/${sodaLidia.id}`);
        const products = await productsRes.json();
        const product = products[0];

        if (!product) {
            throw new Error(`No products found for merchant ${sodaLidia.name}`);
        }

        // 5. Create Order
        const orderRes = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                merchantId: sodaLidia.id,
                items: [{ productId: product.id, quantity: 2 }]
            })
        });
        const orderData = await orderRes.json();
        const orderId = orderData.id;
        console.log('Order Created:', orderId);

        // 6. Merchant: List orders
        console.log('Merchant: Listing orders...');
        const merchantOrdersRes = await fetch(`${API_URL}/orders/merchant`, { headers });
        const merchantOrders = await merchantOrdersRes.json();
        console.log(`Found ${merchantOrders.length} orders for this merchant.`);

        // 7. Merchant: Update status to PREPARING
        console.log('Merchant: Updating order status to PREPARING...');
        const updateRes = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'PREPARING' })
        });
        const updateData = await updateRes.json();

        if (!updateRes.ok) {
            throw new Error(`Status update failed: ${JSON.stringify(updateData)}`);
        }

        console.log('Status Updated:', updateData.status);

        // 8. Verify final status
        if (updateData.status === 'PREPARING') {
            console.log('✅ Merchant Flow Test PASSED!');
        } else {
            console.log('Full response body:', JSON.stringify(updateData, null, 2));
            console.error('❌ Status mismatch!');
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testMerchantFlow();
