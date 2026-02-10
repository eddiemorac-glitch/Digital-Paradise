const crypto = require('crypto');

// Configuration
const API_KEY = '7510-4582-1600-1454-4282'; // Tilopay API Key
const BACKEND_URL = 'http://localhost:3000/payments/tilopay-webhook';
const ORDER_ID = 'c0e55d4a-7427-4a4c-a8f6-d650f4a1a92d';

// Payload (Tilopay format)
const payload = {
    order_number: ORDER_ID,
    transaction_id: 'TEST-TX-' + Date.now(),
    status: 1, // 1 = PAID
    amount: '100.00',
    currency: 'CRC'
};

// Generate HMAC Signature Format: HMAC-SHA256(payload_string, api_key) in hex
const payloadString = JSON.stringify(payload);
const signature = crypto.createHmac('sha256', API_KEY)
    .update(payloadString)
    .digest('hex');

console.log(`Sending Webhook to ${BACKEND_URL}`);
console.log(`Payload: ${payloadString}`);
console.log(`Signature: ${signature}`);

// Send Request using Fetch (Node 18+)
fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-tilopay-signature': signature
    },
    body: payloadString
})
    .then(async res => {
        console.log('✅ Webhook Response Status:', res.status);
        const data = await res.json();
        console.log('Response Data:', data);
    })
    .catch(err => {
        console.error('❌ Webhook Error:', err.message);
    });
