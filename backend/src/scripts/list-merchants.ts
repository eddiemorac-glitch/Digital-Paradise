
import axios from 'axios';
async function test() {
    try {
        const res = await axios.get('http://127.0.0.1:3005/api/merchants');
        console.log('Merchants count:', res.data.length);
        console.log('Merchants:', res.data.map((m: any) => ({ name: m.name, id: m.id })));
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}
test();
