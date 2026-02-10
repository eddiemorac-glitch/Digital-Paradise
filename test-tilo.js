const https = require('https');

const config = {
    apiKey: '7510-4582-1600-1454-4282',
    apiUser: 'yAkLX5',
    apiPassword: 'iHS8zm',
    hostname: 'app.tilopay.com',
    path: '/api/v1'
};

function post(path, data, token = null) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(data);
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': jsonData.length
        };
        if (token) {
            headers['Authorization'] = `bearer ${token}`;
        }

        const options = {
            hostname: config.hostname,
            path: config.path + path,
            method: 'POST',
            headers: headers
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(jsonData);
        req.end();
    });
}

async function testFinalFlow() {
    console.log('Testing Tilopay FINAL Flow (login -> processPayment)...');

    // Step 1: Login (General with key)
    let jwt;
    try {
        const res = await post('/login', {
            apiuser: config.apiUser,
            password: config.apiPassword,
            key: config.apiKey
        });
        if (res.status === 200 && res.data.access_token) {
            jwt = res.data.access_token;
            console.log('Step 1: JWT obtained successfully.');
        } else {
            console.error('Step 1: Login Failed:', res.status, res.data);
            return;
        }
    } catch (e) {
        console.error('Step 1: Login Error:', e.message);
        return;
    }

    // Step 2: processPayment
    try {
        const orderId = 'T-' + Date.now();
        const res = await post('/processPayment', {
            key: config.apiKey,
            amount: '100.00',
            currency: 'CRC',
            orderNumber: orderId,
            redirect: 'http://localhost:5173/payment/callback',
            billToFirstName: 'Usuario',
            billToLastName: 'Prueba',
            billToEmail: 'test@caribedigital.cr',
            billToAddress: 'San Jose',
            billToCity: 'San Jose',
            billToCountry: 'CR',
            billToState: 'SJ',
            billToTelephone: '88888888',
            capture: '1',
            platform: 'api'
        }, jwt);

        console.log('Step 2: processPayment Result:', res.status, res.data);
        if (res.data.token || res.data.sessionToken || res.data.id) {
            console.log('SUCCESS! REAL Session Token generated:', res.data.token || res.data.sessionToken || res.data.id);
        } else {
            console.warn('API called, but check response fields. Data:', JSON.stringify(res.data));
        }
    } catch (e) {
        console.error('Step 2: processPayment Error:', e.message);
    }
}

testFinalFlow();
