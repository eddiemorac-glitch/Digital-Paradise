# 🏗️ BACKEND REBIRTH: Caribe Digital CR (v2.0)

## 🎯 Objetivo
Reconstruir el backend desde cero utilizando una arquitectura **Modular, Escalable y Robusta**, eliminando el enfoque experimental y aplicando las mejores prácticas de NestJS y Clean Architecture.

## 🧱 Arquitectura Propuesta (DDD Lite)
Dividiremos el sistema en dominios claros para evitar el acoplamiento detectado en la v1:

### 1. **Core Domain**
-   **Common**: Decoradores, filtros de excepción globales, interceptores de respuesta.
-   **Database**: Configuración central de TypeORM + PostGIS.
-   **Auth & Security**: JWT con `Passport`, hashing con `bcrypt`.

### 2. **Feature Domains**
-   **Users Module**: Gestión de perfiles y roles.
-   **Merchants Module**: El corazón del sistema (Geolocalización, metadatos de negocios).
-   **Catalog Module**: Productos, categorías y precios.
-   **Delivery Module**: (Futura expansión) Gestión de estados de pedido.

## 🛠️ Stack Tecnológico Producido para Escala
-   **Framework**: NestJS (TypeScript).
-   **ORM**: TypeORM con Migraciones (No más `synchronize: true` en producción).
-   **Database**: PostgreSQL 16 + PostGIS.
-   **Validation**: `class-validator` + `class-transformer`.
-   **Security**: Argon2 (más robusto que bcrypt) para hashing.

## 🔐 Plan de Contraseñas (Seguridad Primero)
Generaremos una infraestructura de secretos robusta:
1.  **DB_PASSWORD**: Se generará una nueva contraseña fuerte.
2.  **JWT_SECRET**: Generado mediante entropía de 256 bits.
3.  **ADMIN_INITIAL_KEY**: Para la primera creación de usuario.

---

## 📋 Fases de Ejecución

### **Fase 1: Infraestructura y Reset (Inmediato)**
- [ ] Resetear acceso a PostgreSQL (Configurar nueva contraseña `caribe_master_2026`).
- [ ] Crear base de datos `caribe_digital_v2`.
- [ ] Scaffolding inicial con Nest CLI.

### **Fase 2: Base de Datos y Tipos Dinámicos**
- [ ] Definir entidades base sin circularidades.
- [ ] Configurar soporte SRID 4326 para mapas precisos.

### **Fase 3: Lógica Empresarial y API**
- [ ] Implementar Auth con TokenService modular.
- [ ] Reconstruir Merchants con búsqueda ST_Distance eficiente.
