# Usuarios del Sistema (Actualizado)

Estos son los credenciales actuales configurados en el sistema.

## 🛡️ Administradores

| Rol | Email | Contraseña | Notas |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@caribe.com` | `tortuga123` | **Cuenta Activa y Verificada.** Generada automáticamente por el sistema. |
| **Dev Admin** | `admin@caribedigital.cr` | -- | Pendiente de configuración. Usar la cuenta de arriba. |

> **Importante:** La cuenta `admin@caribe.com` tiene permisos totales y está lista para usar.

## 👥 Usuarios de Prueba (Seed)

Estos usuarios se generan automáticamente al iniciar la aplicación si no existen datos.
**Contraseña para todos:** `tortuga123`

| Rol | Email | Contraseña | Nombre |
| :--- | :--- | :--- | :--- |
| **Cliente** | `cliente@caribe.com` | `tortuga123` | Carlos Cliente |
| **Comercio** | `comercio@caribe.com` | `tortuga123` | Maria Merchant (Dueña de Bread & Chocolate) |
| **Repartidor** | `repartidor@caribe.com` | `tortuga123` | Rafa Repartidor |

## 🛠️ Comandos de Reinicio
Si deseas reiniciar las contraseñas a estos valores por defecto, puedes borrar la base de datos o correr el seed manualmente (si está configurado).

Ubicación de la lógica de usuarios: `backend/src/shared/seeders/seed.service.ts`
