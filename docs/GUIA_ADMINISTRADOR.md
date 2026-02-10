# 🌴 Guía Maestra del Administrador - Caribe Digital CR
## Versión 2.1.0 (Pura Vida Edition)

Bienvenido, Administrador. Esta guía detalla cómo gobernar y operar el ecosistema de **Caribe Digital**, asegurando una experiencia premium para comercios, repartidores y clientes.

---

### 1. Filosofía del Sistema
Caribe Digital opera bajo una arquitectura de **"Triángulo de Operación Real-Time"**:
1.  **Comercios (Merchants):** Ofrecen productos y preparan pedidos.
2.  **Repartidores (Couriers):** Ejecutan la logística mediante el sistema "Smart Dispatch".
3.  **Clientes:** Realizan pedidos y pagos seguros (Stripe).

Como administrador, tu rol es supervisar la integridad de estos tres nodos.

---

### 2. Control de Acceso y Roles
El sistema utiliza un **RBAC (Role-Based Access Control)** estricto:
-   **ADMIN:** Acceso total (supervisión de Sentinel).
-   **MERCHANT:** Acceso al *Merchant Dashboard* (gestión de productos y pedidos).
-   **DELIVERY:** Acceso al *Courier Central* (gestión de misiones logísticas).
-   **USER:** Cliente final con acceso a compras y facturas.

*Nota: Para cambiar un rol en desarrollo, se debe modificar el campo `role` en la tabla `users` mediante base de datos o consola.*

---

### 3. Gestión de Operaciones

#### 📦 Pedidos y Logística (Real-Time)
El sistema utiliza **WebSockets** para que todas las actualizaciones sean instantáneas.
-   **Misiones:** Cada pedido genera una misión automática.
-   **Courier Central:** Los repartidores ven las misiones disponibles. Tú puedes monitorear estas misiones en vivo.
-   **Sentinel:** En caso de fallos de conexión, el script `sentinel_caribe.py` verifica la integridad de los nodos de datos.

#### 💳 Pagos y Finanzas
-   **Stripe:** Los pagos se procesan de forma encriptada. Puedes ver los flujos de dinero en tu Dashboard de Stripe.
-   **Facturación Electrónica (Hacienda):** El sistema genera automáticamente la **Clave Numérica de 50 dígitos** y el consecutivo legal exigido por el Ministerio de Hacienda de Costa Rica (versión 4.3).

#### 🌿 Certificación de Sostenibilidad (Eco-Friendly)
Como administrador, puedes otorgar el sello **"Sostenible"** a los comercios que cumplan con prácticas eco-responsables (empaques biodegradables, ingredientes locales, etc.):
1.  Ve a la pestaña **"Comercios"** en el Admin Dashboard.
2.  Busca el comercio mediante el motor de búsqueda integrado.
3.  Activa el switch de **Sostenibilidad**. Esto activará automáticamente el distintivo verde en el perfil del comercio y lo incluirá en los filtros premium de la app móvil.


---

### 4. Salud del Sistema (Sentinela)
Para asegurar que el sistema no tenga "latencia de realidad" o "drift" de archivos, utiliza la herramienta **Sentinel**:
1. Abre una terminal en la raíz del proyecto.
2. Ejecuta: `python sentinel_caribe.py`
3. El sistema verificará la integridad de los 21 componentes críticos y regenerará el mapa de conocimiento si es necesario.

---

### 5. Configuración de Entorno (.env)
Como administrador, debes conocer las variables clave:
-   `DATABASE_URL`: Conexión a la base de datos central.
-   `JWT_SECRET`: Llave Maestra para la seguridad de sesiones.
-   `STRIPE_SECRET_KEY`: Conexión con la pasarela de pagos.
-   `VITE_API_URL`: Dirección donde el frontend busca al backend.

---

### 6. Cumplimiento Legal (Ley 8968)
El sistema está diseñado para cumplir con la **Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales**:
-   Los usuarios deben aceptar la **Política de Privacidad** al registrarse.
-   El sistema registra el consentimiento explícito y la fecha de aceptación.

---

### 7. Comandos de Emergencia
Si necesitas reiniciar el sistema completo localmente:
-   `./START_ALL.ps1`: Inicia Backend, Frontend y Base de Datos en paralelo.
-   `npm run build`: Ejecuta esto en `frontend` para verificar que no haya errores de código antes de un despliegue.

---

*“La tecnología es el viento, pero el Caribe es el alma.”* 🌴🌊
**Equipo de Ingeniería Caribe Digital**
