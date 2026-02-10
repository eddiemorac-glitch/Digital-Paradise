# 🤖 Prompt for Executor (Forge)

**Contexto**:
Actúas como **Forge**, el brazo ejecutor del Protocolo Nova. Yo (el Logic Master) he diseñado la arquitectura para la **Fase 19: Sincronización Real-time y Endurecimiento Sentinel**. Tu misión es "ensuciarte las manos" e implementar estos cambios en el código.

**Objetivos de la Misión**:
1.  **Transformar Sentinel**: Convertir `sentinel_caribe.py` de un observador pasivo a un monitor de salud activo.
2.  **Blindar WebSockets**: Asegurar que la conexión del cliente (`socket.ts`) sobreviva a desconexiones de red y mantenga la autenticación.

---

## 🛠️ Instrucciones de Implementación

### Tarea 1: Endurecimiento de Sentinel (Python)
Edita el archivo `sentinel_caribe.py`.
1.  Importa las librerías necesarias: `socket`, `requests` (si no está, usa `urllib` para no añadir dependencias externas si es posible, o asume entorno estándar).
2.  Crea una clase `SystemHealthCheck` dentro del archivo con:
    *   Método `check_port(host, port)`: Intenta conectar un socket a `localhost:3000` (Backend) y `localhost:5173` (Frontend). Retorna `True` si responde.
    *   Método `report_status()`: Imprime en consola el estado con emojis (🟢/🔴).
3.  Integra esta clase en el bucle principal de `CaribeSentinel`. Haz que ejecute el chequeo cada 60 segundos en un hilo separado o en el loop principal si no bloquea.

### Tarea 2: Resiliencia de WebSockets (Frontend)
Edita el archivo `frontend/src/api/socket.ts`.
1.  En el método `connect()`:
    *   Extrae el token actual usando `localStorage.getItem('token')` (o tu store de preferencia).
    *   Pásalo en las opciones de `io(SOCKET_URL, { auth: { token }, ... })`.
    *   Configura `reconnection: true`, `reconnectionAttempts: 5`.
2.  Añade manejo de errores de conexión:
    *   `this.socket.on('connect_error', (err) => { ... })`.
    *   Si el error contiene "Unauthorized", fuerza una desconexión limpia o emite un evento de 'auth_error' para que la UI reaccione (logout).
3.  Implementar lógica de re-unión:
    *   Al reconectar (`this.socket.on('connect')`), asegúrate de volver a emitir los eventos de unión a salas (`join_merchant_room` o `join_logistics_pool`) si el usuario estaba previamente conectado.

### Tarea 3: Verificación Rápida
*   Asegúrate de que no rompes la compilación de TypeScript.
*   Mantén los logs limpios y profesionales.

---

**Nota del Arquitecto**:
Confío en tu capacidad para escribir código eficiente. No cambies la lógica de negocio, solo robustece la infraestructura existente. ¡Ejecuta!
