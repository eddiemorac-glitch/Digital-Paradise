const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'caribe_digital_v2',
    password: 'caribe_master_2026',
    port: 5432,
});

async function checkLatestOrder() {
    try {
        await client.connect();

        // Get latest order
        const orderRes = await client.query(`
      SELECT o.id, o.status, o.total, o."createdAt", u.email as user_email, m.name as merchant_name 
      FROM orders o
      JOIN users u ON o."userId" = u.id
      JOIN merchants m ON o."merchantId" = m.id
      ORDER BY o."createdAt" DESC
      LIMIT 1
    `);

        if (orderRes.rows.length === 0) {
            console.log('No orders found in database.');
            return;
        }

        const order = orderRes.rows[0];
        console.log('--------------------------------------------------');
        console.log('✅ LATEST ORDER VERIFICATION');
        console.log('--------------------------------------------------');
        console.log(`Order ID:      ${order.id}`);
        console.log(`Status:        ${order.status}`);
        console.log(`Total:         ₡${Number(order.total).toLocaleString()}`);
        console.log(`Created At:    ${order.createdAt}`);
        console.log(`User:          ${order.user_email}`);
        console.log(`Merchant:      ${order.merchant_name}`);

        // Get items
        const itemsRes = await client.query(`
      SELECT p.name, oi.quantity, oi.subtotal
      FROM order_items oi
      JOIN products p ON oi."productId" = p.id
      WHERE oi."orderId" = $1
    `, [order.id]);

        console.log('\n📦 ITEMS:');
        itemsRes.rows.forEach(item => {
            console.log(` - ${item.quantity}x ${item.name} (Subtotal: ₡${Number(item.subtotal).toLocaleString()})`);
        });
        console.log('--------------------------------------------------');

    } catch (err) {
        console.error('Error auditing orders:', err);
    } finally {
        await client.end();
    }
}

checkLatestOrder();
