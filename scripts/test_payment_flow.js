// Test script to diagnose Tilopay 500 error
// Run with: node test_payment_flow.js

const http = require('http');

// Test 1: Check if tilopay-token endpoint requires auth
const testNoAuth = () => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/payments/tilopay-token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[TEST 1] No Auth - Status: ${res.statusCode}`);
                console.log(`[TEST 1] Response: ${data}`);
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            console.error(`[TEST 1] Error: ${e.message}`);
            resolve(null);
        });

        req.write(JSON.stringify({
            orderId: 'test-order-123',
            amount: 5000,
            currency: 'CRC'
        }));
        req.end();
    });
};

// Test 2: Check backend health
const testHealth = () => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/auth/profile',  // Just to test any authenticated route
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`[TEST 2] Profile without auth - Status: ${res.statusCode}`);
            resolve(res.statusCode);
        });

        req.on('error', (e) => {
            console.error(`[TEST 2] Backend not reachable: ${e.message}`);
            console.log('[DIAGNOSIS] Backend might not be running on port 3000');
            resolve(null);
        });

        req.end();
    });
};

// Test 3: Check if orders endpoint is accessible
const testOrdersEndpoint = () => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/orders',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[TEST 3] Orders POST without auth - Status: ${res.statusCode}`);
                console.log(`[TEST 3] Response: ${data}`);
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            console.error(`[TEST 3] Error: ${e.message}`);
            resolve(null);
        });

        req.write(JSON.stringify({
            merchantId: 'test-merchant',
            items: [{ productId: 'test-product', quantity: 1 }]
        }));
        req.end();
    });
};

async function runTests() {
    console.log('=== PAYMENT FLOW DIAGNOSTIC TESTS ===\n');

    await testHealth();
    console.log('');

    await testNoAuth();
    console.log('');

    await testOrdersEndpoint();

    console.log('\n=== DIAGNOSIS COMPLETE ===');
    console.log('If all tests return 401, authentication is working correctly.');
    console.log('The 500 error is likely in the frontend request or order creation logic.');
    console.log('Check the backend terminal for [TILOPAY] logs when making a payment.');
}

runTests();
