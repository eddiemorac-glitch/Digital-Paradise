# ⚙️ Guía de Configuración y Configuración

Esta guía consolida los pasos necesarios para poner en marcha el backend de **Caribe Digital CR**.

## 🛠️ Requisitos Previos

1.  **Node.js** (v18 o superior)
2.  **PostgreSQL 16** con la extensión **PostGIS**
3.  **PowerShell** (ejecutado como Administrador para scripts de instalación)

## ⚡ Instalación Rápida (Recomendado)

Abre una terminal de PowerShell como **Administrador** en la carpeta del backend y ejecuta el script maestro:

```powershell
cd "backend"
.\setup-complete.ps1
```

Este script automatiza:
- Instalación de PostgreSQL (si falta).
- Creación de la base de datos `puerto_digital`.
- Habilitación de PostGIS.
- Creación del archivo `.env` desde la plantilla.
- Instalación de dependencias de Node.js.

## 🔍 Verificación de Estado

Para saber qué falta o qué está fallando, ejecuta:

```powershell
.\check-status.ps1
```

## 📝 Variables de Entorno (.env)

Asegúrate de configurar los siguientes valores en tu archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
DB_DATABASE=puerto_digital
JWT_SECRET=tu_secreto_super_seguro
```

## 📂 Estructura de Scripts

- `setup-complete.ps1`: Automatización total.
- `setup-database.ps1`: Solo configuración de DB y PostGIS.
- `install-postgresql.ps1`: Descarga e instala el binario de Postgres.
- `check-status.ps1`: Auditoría del entorno local.
