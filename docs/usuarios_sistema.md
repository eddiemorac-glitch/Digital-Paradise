# Usuarios del Sistema (Actualizado)

Estos son los credenciales actuales configurados en el sistema.

## 🛡️ Administradores

| Rol | Email | Contraseña | Notas |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@caribedigital.cr` | `CaribeMaximumSecurity2026!` | Acceso total, cuenta principal. |
| **Dev Admin** | `admin@caribe.com` | `admin123` | Puede ser `tortuga123` si no se ha corrido el script de admin. |

> **Nota:** Si `admin123` no funciona para el Dev Admin, intenta con `tortuga123`.

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
