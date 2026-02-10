# Guía de Despliegue - Caribe Digital 🌴

## 1. Frontend (Vercel)
La aplicación frontend está configurada para desplegarse en **Vercel** como una SPA (Single Page Application).

### Archivos Clave
*   `vercel.json`: Configura el enrutamiento para que todas las peticiones vayan a `index.html`.

### Pasos
1.  Conecta tu repositorio a Vercel.
2.  Importa el proyecto seleccionado la carpeta `frontend` como raíz.
3.  **Build Command:** `npm run build`
4.  **Output Directory:** `dist`
5.  **Environment Variables:**
    *   `VITE_API_URL`: URL de tu backend en producción (ej. https://api.caribedigital.cr).
    *   `VITE_TILOPAY_PUBLIC_KEY`: Tu llave pública de Tilopay (si aplica).

## 2. Backend (Render / Docker)
El backend está dockerizado para máxima compatibilidad. Recomendamos **Render** o **Railway**.

### Archivos Clave
*   `Dockerfile`: Construcción multi-stage optimizada para producción.

### Pasos (Render)
1.  Conecta tu repositorio a Render.
2.  Selecciona "Web Service" -> "Docker".
3.  Apunta a la carpeta `backend` o la raíz si Dockerfile está ahí.
4.  **Environment Variables (PROD):**
    *   `NODE_ENV`: `production`
    *   `PORT`: `3000`
    *   `DATABASE_HOST`: Tu host de PostgreSQL (ej. Supabase, Neon, RDS).
    *   `DATABASE_PORT`: `5432`
    *   `DATABASE_USER`: Usuario DB.
    *   `DATABASE_PASSWORD`: Password DB.
    *   `DATABASE_NAME`: `caribe_db`
    *   `JWT_SECRET`: ¡Genera un secreto fuerte!
    *   `TILOPAY_API_KEY`: Tu llave de Tilopay (Live).
    *   `HACIENDA_API_KEY`: Tu llave de Hacienda (v4.4).
    *   `CORS_ORIGIN`: La URL de tu frontend (ej. https://caribedigital.cr).

## 3. Pre-flight Checklist ✅
antes de ir a producción:
- [ ] **Base de Datos:** Asegúrate de correr las migraciones o `typeorm schema:sync` (con cuidado) en la DB de producción.
- [ ] **Payments:** Cambia las llaves de Sandbox a Live en el dashboard de Tilopay.
- [ ] **Hacienda:** Para facturación real, asegúrate de haber cargado el archivo .p12 y PIN en el módulo de Merchants para cada comercio.
- [ ] **Seguridad:** Verifica que `CORS_ORIGIN` esté restringido solo a tu dominio frontend.
