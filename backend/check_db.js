
const { Client } = require('pg');

async function checkReviews() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'sentinel2024',
        database: 'caribe_digital',
    });

    try {
        await client.connect();
        console.log('--- REVIEWS ---');
        const res = await client.query('SELECT * FROM reviews;');
        console.table(res.rows);

        console.log('--- MERCHANTS WITH RATINGS ---');
        const res2 = await client.query(`
      SELECT m.name, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
      FROM merchants m
      LEFT JOIN reviews r ON m.id = r."merchantId"
      GROUP BY m.id, m.name
      HAVING COUNT(r.id) > 0;
    `);
        console.table(res2.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

checkReviews();
