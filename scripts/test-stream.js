
const axios = require('axios');

async function testStream() {
    try {
        const response = await axios({
            method: 'post',
            url: 'http://localhost:3000/coco-ai/chat-stream',
            data: { message: 'Hola COCO, ¿cómo estás?' },
            headers: {
                'Content-Type': 'application/json',
                // We need a valid token here, but let's see if we get a 401 at least
                'Authorization': 'Bearer test'
            },
            responseType: 'stream'
        });

        console.log('Stream started...');
        response.data.on('data', (chunk) => {
            console.log('CHUNK:', chunk.toString());
        });

        response.data.on('end', () => {
            console.log('Stream ended.');
        });
    } catch (e) {
        console.error('Error:', e.response ? e.response.status : e.message);
        if (e.response && e.response.data) {
            // response.data is a stream here, so maybe we can't see the error easily
        }
    }
}

testStream();
