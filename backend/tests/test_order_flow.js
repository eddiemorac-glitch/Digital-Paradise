async function runTest() {
    const baseUrl = 'http://127.0.0.1:3003';
    let token = '';
    let merchantId = '';
    let productId = '';

    // 1. Login
    console.log('--- LOGIN ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@caribe.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    token = loginData.access_token;
    console.log('Token acquired');

    // 2. Get Merchants
    console.log('--- GET MERCHANTS ---');
    const merchRes = await fetch(`${baseUrl}/merchants`, { headers: { Authorization: `Bearer ${token}` } });
    const merchants = await merchRes.json();
    if (merchants.length === 0) throw new Error('No merchants found');
    merchantId = merchants[0].id;
    console.log('Merchant ID:', merchantId);

    // 3. Get Products
    console.log('--- GET PRODUCTS ---');
    const prodRes = await fetch(`${baseUrl}/products/merchant/${merchantId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!prodRes.ok) {
        const text = await prodRes.text();
        throw new Error(`Failed to get products: ${prodRes.status} ${text}`);
    }
    const products = await prodRes.json();
    if (products.length === 0) throw new Error('No products found');
    productId = products[0].id;
    console.log('Product ID:', productId);

    // 4. Create Order
    console.log('--- CREATE ORDER ---');
    const orderRes = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            merchantId: merchantId,
            items: [{ productId: productId, quantity: 2 }]
        })
    });
    if (!orderRes.ok) {
        const text = await orderRes.text();
        throw new Error(`Failed to create order: ${orderRes.status} ${text}`);
    }
    const order = await orderRes.json();
    console.log('Order Created:', order.id, 'Status:', order.status, 'Total:', order.total);

    // 5. Verify History
    console.log('--- CHECK HISTORY ---');
    const histRes = await fetch(`${baseUrl}/orders/mine`, { headers: { Authorization: `Bearer ${token}` } });
    const history = await histRes.json();
    console.log('My Orders Count:', history.length);
    console.log('Latest Order ID:', history[0].id);
}

runTest().catch(e => console.error('TEST FAILED:', e.message));
