
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDB() {
    const client = new Client({
        user: process.env.DB_USERNAME,
        host: 'localhost',
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
    });

    try {
        await client.connect();
        console.log('--- MERCHANTS ---');
        const resMerchants = await client.query('SELECT id, name, "userId", "isActive", status FROM merchants LIMIT 10;');
        console.table(resMerchants.rows);

        console.log('\n--- USERS ---');
        const resUsers = await client.query('SELECT id, email, role, "isActive" FROM users LIMIT 10;');
        console.table(resUsers.rows);

        // Check specifically for merchant roles
        const resMerchantUsers = await client.query("SELECT id, email, role FROM users WHERE role = 'merchant';");
        console.log('\n--- MERCHANT USERS ---');
        console.table(resMerchantUsers.rows);

    } catch (err) {
        console.error('Error connecting to DB:', err);
    } finally {
        await client.end();
    }
}

checkDB();
