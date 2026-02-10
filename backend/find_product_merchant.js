const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

async function findProduct() {
    const client = new Client({
        user: process.env.DB_USERNAME || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'caribe_digital',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
    });

    try {
        await client.connect();
        const query = `
            SELECT p.id, p.name, p.price, p."merchantId", m.name as merchant_name 
            FROM products p 
            JOIN merchants m ON p."merchantId" = m.id 
            WHERE p.name ILIKE '%Platanos Maduros%';
        `;
        const res = await client.query(query);
        if (res.rows.length > 0) {
            console.log('FOUND_PRODUCT:', JSON.stringify(res.rows[0]));
        } else {
            console.log('PRODUCT_NOT_FOUND');
        }
    } catch (err) {
        console.error('Error finding product:', err);
    } finally {
        await client.end();
    }
}

findProduct();
