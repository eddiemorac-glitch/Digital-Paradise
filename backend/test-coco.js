const https = require('https');

const data = JSON.stringify({
    message: 'Hola Coco, ¿qué me recomiendas para cenar en Puerto Viejo?'
});

const options = {
    hostname: 'digital-paradise.onrender.com',
    port: 443,
    path: '/api/coco-ai/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    res.setEncoding('utf8');
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Response Body:');
        console.log(body);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
