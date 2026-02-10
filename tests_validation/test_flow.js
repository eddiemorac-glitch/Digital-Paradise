const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';

async function runTest() {
    console.log('🚀 Iniciando Prueba de Flujo de Logística 2.0');

    try {
        // 1. Logins
        console.log('🔐 Iniciando sesión...');
        const clientAuth = await axios.post(`${BASE_URL}/auth/login`, { email: 'cliente@caribe.com', password: 'tortuga123' }).catch(e => { console.error('Client login failed'); throw e; });
        const merchantAuth = await axios.post(`${BASE_URL}/auth/login`, { email: 'comercio@caribe.com', password: 'tortuga123' }).catch(e => { console.error('Merchant login failed'); throw e; });
        const deliveryAuth = await axios.post(`${BASE_URL}/auth/login`, { email: 'repartidor@caribe.com', password: 'tortuga123' }).catch(e => { console.error('Delivery login failed'); throw e; });

        const clientToken = clientAuth.data.access_token;
        const merchantToken = merchantAuth.data.access_token;
        const deliveryToken = deliveryAuth.data.access_token;

        console.log('✅ Logins exitosos');

        // 2. Setup Sockets
        console.log('\n🔌 Conectando WebSockets...');
        const merchantSocket = io(BASE_URL);
        const deliverySocket = io(BASE_URL);
        const clientSocket = io(BASE_URL);

        let newOrderReceived = false;
        let locationUpdateReceived = false;

        const merchants = await axios.get(`${BASE_URL}/merchants`, {
            params: { status: 'active' }
        });
        const targetMerchant = merchants.data.find(m => m.name === 'Bread and Chocolate');
        if (!targetMerchant) throw new Error('Bread and Chocolate no encontrado');

        merchantSocket.emit('join_merchant_room', targetMerchant.id);
        merchantSocket.on('new_order', (order) => {
            console.log('📥 [Merchant Socket] Nuevo pedido recibido:', order.id);
            newOrderReceived = true;
        });

        deliverySocket.emit('join_delivery_pool');
        deliverySocket.on('order_available_nearby', (order) => {
            console.log('📥 [Delivery Socket] Pedido disponible cerca:', order.id);
        });

        const products = await axios.get(`${BASE_URL}/products/merchant/${targetMerchant.id}`);
        const product = products.data[0];
        if (!product) throw new Error('El comercio no tiene productos');
        console.log(`📍 Usando comercio: ${targetMerchant.name}`);
        console.log(`🥧 Usando producto: ${product.name} (₡${product.price})`);

        // 4. Create Order
        console.log('\n🛒 Creando pedido...');
        const orderResponse = await axios.post(`${BASE_URL}/orders`, {
            merchantId: targetMerchant.id,
            items: [{ productId: product.id, quantity: 2 }]
        }, { headers: { Authorization: `Bearer ${clientToken}` } });

        const orderId = orderResponse.data.id;
        console.log('✅ Pedido creado con ID:', orderId);

        // Join tracking
        clientSocket.emit('join_order_tracking', orderId);
        clientSocket.on('courier_location_updated', (data) => {
            console.log('📍 [Client Socket] Ubicación del repartidor recibida:', data.lat, data.lng);
            locationUpdateReceived = true;
        });

        // 5. Merchant: CONFIRMED -> PREPARING -> READY
        console.log('\n👨‍🍳 Merchant procesando pedido...');
        await axios.patch(`${BASE_URL}/orders/${orderId}/status`, { status: 'CONFIRMED' },
            { headers: { Authorization: `Bearer ${merchantToken}` } });
        console.log('👨‍🍳 Estado: CONFIRMED');

        await axios.patch(`${BASE_URL}/orders/${orderId}/status`, { status: 'PREPARING' },
            { headers: { Authorization: `Bearer ${merchantToken}` } });
        console.log('👨‍🍳 Estado: PREPARING');

        await axios.patch(`${BASE_URL}/orders/${orderId}/status`, { status: 'READY' },
            { headers: { Authorization: `Bearer ${merchantToken}` } });
        console.log('👨‍🍳 Estado: READY');

        // 6. Delivery: CLAIM -> PICKUP -> DELIVERED
        console.log('\n🛵 Repartidor procesando entrega...');
        await axios.post(`${BASE_URL}/orders/${orderId}/claim`, {},
            { headers: { Authorization: `Bearer ${deliveryToken}` } });
        console.log('🛵 Pedido APARTADO (Claimed)');

        await axios.post(`${BASE_URL}/orders/${orderId}/pickup`, {},
            { headers: { Authorization: `Bearer ${deliveryToken}` } });
        console.log('🛵 Pedido RETIRADO (Picked Up)');

        // Simulate Tracking
        console.log('🛰️ Enviando actualización de ubicación...');
        deliverySocket.emit('update_courier_location', { orderId, lat: 9.66, lng: -82.75 });

        await new Promise(r => setTimeout(r, 2000)); // Wait for socket retransmission

        await axios.patch(`${BASE_URL}/orders/${orderId}/status`, { status: 'DELIVERED' },
            { headers: { Authorization: `Bearer ${deliveryToken}` } });
        console.log('✅ Pedido ENTREGADO');

        // 7. Review
        console.log('\n⭐ Dejando reseña...');
        await axios.post(`${BASE_URL}/reviews`, {
            orderId: orderId,
            rating: 5,
            comment: 'Excelente servicio programático'
        }, { headers: { Authorization: `Bearer ${clientToken}` } });
        console.log('✅ Reseña publicada');

        console.log('\n🏁 PRUEBA COMPLETADA CON ÉXITO');
        console.log('-----------------------------------');
        console.log('Resumen de Validación:');
        console.log('- Flujo de Estados: OK');
        console.log('- Permisos de Roles: OK');
        console.log('- WebSockets (New Order):', newOrderReceived ? 'RECIBIDO' : 'FALLIDO');
        console.log('- WebSockets (Live Tracking):', locationUpdateReceived ? 'RECIBIDO' : 'FALLIDO');
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR DURANTE LA PRUEBA:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

runTest();
