const API_URL = 'http://127.0.0.1:3003';

async function logStep(msg) {
    console.log(`\n🚀 [STEP] ${msg}`);
}

async function runE2E() {
    try {
        console.log('--- STARTING E2E FULL FLOW AUDIT ---');

        // 1. LOGIN ALL ROLES
        const roles = [
            { id: 'client', email: 'cliente@caribe.com', password: 'tortuga123' },
            { id: 'merchant', email: 'comercio@caribe.com', password: 'tortuga123' },
            { id: 'courier', email: 'repartidor@caribe.com', password: 'tortuga123' }
        ];

        const tokens = {};
        for (const role of roles) {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: role.email, password: role.password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(`Login failed for ${role.id}: ${JSON.stringify(data)}`);
            tokens[role.id] = data.access_token;
            console.log(`✅ Logged in as ${role.id}`);
        }

        // 2. GET MERCHANT & PRODUCT (Client Context)
        await logStep('Client finding Merchant & Product');
        const merchRes = await fetch(`${API_URL}/merchants`);
        const merchantsResult = await merchRes.json();
        const merchants = Array.isArray(merchantsResult) ? merchantsResult : merchantsResult.data;
        const merchant = merchants.find(m => m.name.includes('Bread'));
        if (!merchant) throw new Error('Bread & Chocolate merchant not found');
        console.log(`Found Merchant: ${merchant.name} (ID: ${merchant.id})`);

        const prodRes = await fetch(`${API_URL}/products/merchant/${merchant.id}`);
        const products = await prodRes.json();
        const product = products[0];
        if (!product) throw new Error('No products found for merchant');
        console.log(`Found Product: ${product.name} (ID: ${product.id})`);

        // 3. CREATE ORDER (Client)
        await logStep('Client creating Order');
        const orderRes = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokens.client}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                merchantId: merchant.id,
                items: [{ productId: product.id, quantity: 1 }],
                deliveryAddress: 'Puerto Viejo Central',
                deliveryLat: Number(merchant.latitude) + 0.005,
                deliveryLng: Number(merchant.longitude) + 0.005
            })
        });
        const order = await orderRes.json();
        if (!orderRes.ok) throw new Error(`Order creation failed: ${JSON.stringify(order)}`);
        console.log(`✅ Order Created: ${order.id} | Status: ${order.status}`);

        // 4. MERCHANT HANDS-OFF (Merchant)
        await logStep('Merchant accepting and preparing Order');
        const statusSteps = ['CONFIRMED', 'PREPARING', 'READY'];
        for (const status of statusSteps) {
            const updateRes = await fetch(`${API_URL}/orders/${order.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${tokens.merchant}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            const updateData = await updateRes.json();
            if (!updateRes.ok) throw new Error(`Status update to ${status} failed: ${JSON.stringify(updateData)}`);
            console.log(`   -> Status updated to: ${updateData.status}`);
        }

        // 5. COURIER DISCOVERY (Courier)
        await logStep('Courier checking for available missions');
        const availableRes = await fetch(`${API_URL}/orders/delivery/available`, {
            headers: { 'Authorization': `Bearer ${tokens.courier}` }
        });
        const availableMissions = await availableRes.json();
        const myMission = availableMissions.find(m => m.id === order.id);
        if (!myMission) throw new Error('Our order did not appear in available missions pool');
        console.log(`✅ Mission Found in pool: ${myMission.id}`);

        // 6. COURIER CLAIM (Courier)
        await logStep('Courier claiming Mission');
        const claimRes = await fetch(`${API_URL}/orders/${order.id}/claim`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokens.courier}` }
        });
        const claimData = await claimRes.json();
        if (!claimRes.ok) throw new Error(`Claim failed: ${JSON.stringify(claimData)}`);
        console.log(`✅ Mission Claimed. Current Status: ${claimData.status}`);

        // 7. COURIER PICKUP (Courier)
        await logStep('Courier picking up Order');
        const pickupRes = await fetch(`${API_URL}/orders/${order.id}/pickup`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokens.courier}` }
        });
        const pickupData = await pickupRes.json();
        if (!pickupRes.ok) throw new Error(`Pickup failed: ${JSON.stringify(pickupData)}`);
        console.log(`✅ Order Picked Up. Current Status: ${pickupData.status}`);

        // 8. COURIER DELIVERY (Courier)
        await logStep('Courier completing Delivery');
        const deliverRes = await fetch(`${API_URL}/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${tokens.courier}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'DELIVERED',
                metadata: { podUrl: 'http://test-storage.com/pod.jpg' }
            })
        });
        const deliverData = await deliverRes.json();
        if (!deliverRes.ok) throw new Error(`Delivery completion failed: ${JSON.stringify(deliverData)}`);
        console.log(`✅ Order DELIVERED. Final Status: ${deliverData.status}`);

        console.log('\n🌟🌟🌟 E2E FULL FLOW AUDIT PASSED 🌟🌟🌟');

    } catch (error) {
        console.error('\n❌ E2E AUDIT FAILED:', error.message);
    }
}

runE2E();
