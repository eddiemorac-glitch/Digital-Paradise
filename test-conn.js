
const http = require('http');
const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
});

req.on('timeout', () => {
    console.error('TIMEOUT');
    req.destroy();
});

req.end();
