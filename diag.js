
const http = require('http');

async function testUrl(name, url) {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            console.log(`[${name}] URL: ${url}`);
            console.log(`[${name}] Status: ${res.statusCode}`);
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`[${name}] Bytes: ${data.length}`);
                if (data.length > 0) {
                    console.log(`[${name}] First 100 bytes: ${data.substring(0, 100)}`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`[${name}] ERROR: ${e.message}`);
            resolve();
        });

        req.on('timeout', () => {
            console.error(`[${name}] TIMEOUT`);
            req.destroy();
            resolve();
        });

        req.setTimeout(5000);
    });
}

async function start() {
    await testUrl('BACKEND', 'http://127.0.0.1:3005/api/health');
    await testUrl('FRONTEND', 'http://127.0.0.1:5173');
}

start();
