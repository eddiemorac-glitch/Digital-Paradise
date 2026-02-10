# Caribe Digital - Manual de Pruebas de Aceptación (UAT)
## Fase 4: Pagos y Facturación Electrónica

Este documento guía al usuario a través del flujo completo del sistema "Caribe Digital Pura Vida", verificando las integraciones de Pagos (Stripe), Logística (WebSockets) y Facturación (Hacienda Mock).

### 1. Preparación
- Asegúrese de que el backend y frontend estén corriendo (`npm run start:dev` y `npm run dev`).
- Abra dos ventanas del navegador (o una pestaña de incógnito):
    1. **Ventana A (Cliente):** Para realizar el pedido.
    2. **Ventana B (Repartidor/Merchant):** Para ver el dashboard (inicie sesión con cuenta de repartidor si tiene, o merchant).

### 2. Flujo de Compra (Ventana A)
1.  **Navegación:** Vaya al inicio y seleccione un comercio (ej. "Soda El Caribe").
2.  **Carrito:** Agregue productos al carrito (ej. "Rice and Beans").
3.  **Checkout:**
    -   Abra el carrito lateral.
    -   Verifique que el total incluya el envío (₡1,500).
    -   Haga clic en **"PAGAR AHORA"**.
    -   *Resultado Esperado:* Se abre el modal de pagos oscuro (PaymentModal).
4.  **Pago:**
    -   Ingrese los datos de prueba de Stripe:
        -   **Tarjeta:** `4242 4242 4242 4242`
        -   **Fecha:** `12/34`
        -   **CVC:** `123`
        -   **ZIP:** `10000`
    -   Haga clic en **"Pagar ₡..."**.
    -   *Resultado Esperado:* Spinner de carga, seguido de cierre del modal y mensaje de éxito. El carrito se vacía.

### 3. Logística y Despacho (Ventana B)
1.  **Dashboard:** Vaya a su Dashboard (si es Merchant/Repartidor) o use la vista de "Courier Central" si está habilitada.
2.  **Recepción:**
    -   *Resultado Esperado:* Debería ver aparecer la nueva misión/orden en la lista de "Misiones Disponibles" o "Pedidos Recientes" en tiempo real (sin recargar).

### 4. Facturación Electrónica (Ventana A)
1.  **Mis Facturas:**
    -   En el menú principal, haga clic en el nuevo botón **"FACTURAS"**.
2.  **Verificación:**
    -   *Resultado Esperado:* Aparece la lista de facturas.
    -   Busque la orden recién creada.
    -   Verifique que tenga una **Clave Numérica** de 50 dígitos (ej. `506...`).
    -   Verifique que aparezca el botón "PDF" y "XML".
3.  **Descarga:**
    -   Haga clic en "PDF".
    -   *Resultado Esperado:* Alerta indicando "Descargando PDF...".

### 5. Finalización
-   Si todos los pasos anteriores funcionan, la Fase 4 está completa y lista para despliegue (previa configuración de llaves reales de Stripe y API de Hacienda).
