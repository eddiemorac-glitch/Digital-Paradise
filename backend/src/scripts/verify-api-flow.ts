
import axios from 'axios';
// Removing uuid dependency as it is not installed
// import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://127.0.0.1:3005';

function generateRandomString() {
    return Math.random().toString(36).substring(7);
}

async function runVerification() {
    console.log('🚀 Starting Verification Flow...');

    try {
        const uniqueId = generateRandomString();
        const email = `test-customer-x${uniqueId}@example.com`;
        const password = 'Password123!';
        const fullName = `Test Customer ${uniqueId}`;

        console.log(`👤 Registering user: ${email}...`);

        try {
            await axios.post(`${API_URL}/auth/register`, {
                email,
                password,
                fullName,
                agreedToPrivacyPolicy: true,
                privacyPolicyVersion: '1.0'
            });
            console.log('✅ Registered successfully!');
        } catch (regError: any) {
            console.error('❌ Registration Failed!');
            console.error('Status:', regError.response?.status);
            console.error('Data:', JSON.stringify(regError.response?.data, null, 2));
            throw regError;
        }

        // 2. Login
        console.log('🔑 Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = loginRes.data.access_token;
        console.log(`✅ Logged in! Token: ${token.substring(0, 10)}...`);

        console.log('🔍 Searching for "Platanos Maduros"...');
        const merchantsRes = await axios.get(`${API_URL}/merchants`);
        const merchants = merchantsRes.data;

        let targetProduct: any = null;
        let targetMerchant: any = null;

        for (const merchant of merchants) {
            try {
                const productsRes = await axios.get(`${API_URL}/products/merchant/${merchant.id}`);
                const products = productsRes.data;
                // Case insensitive search just in case
                const found = products.find((p: any) => p.name.toLowerCase().includes('platanos maduros'));
                if (found) {
                    targetProduct = found;
                    targetMerchant = merchant;
                    console.log(`✅ Found product "${found.name}" in merchant: ${merchant.name} (ID: ${merchant.id})`);
                    break;
                }
            } catch (err) {
                // ignore errors fetching products for a specific merchant
            }
        }

        if (!targetProduct) {
            console.log('❌ Product "Platanos Maduros" not found. Check if it was created correctly.');
            process.exit(1);
        }

        console.log('🛒 Creating Order...');
        const orderPayload = {
            merchantId: targetMerchant.id,
            items: [{ productId: targetProduct.id, quantity: 2 }],
            deliveryAddress: 'Test Address 123',
            deliveryLat: 9.65,
            deliveryLng: -82.75
        };

        const orderRes = await axios.post(`${API_URL}/orders`, orderPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Order Created! Order ID: ${orderRes.data.id}`);
        console.log('🎉 Verification Successful! Product found and purchased.');

    } catch (error: any) {
        if (!error.response) console.error('❌ Error:', error.message);
        else {
            console.error('❌ API Error:', error.response.status, error.response.data);
        }
        process.exit(1);
    }
}

runVerification();
