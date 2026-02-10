# 🌴 Caribe Digital CR - Documentación Unificada

Bienvenido a la documentación centralizada del proyecto **Caribe Digital CR**. Este documento sirve como punto de entrada para entender la arquitectura, instalación y pruebas del sistema.

## 📌 Mapa del Proyecto

- **Backend**: NestJS, PostgreSQL + PostGIS (Ubicado en `/backend`)
- **Frontend**: Vite, React, TypeScript (Ubicado en `/frontend`)
- **Infraestructura**: Scripts de automatización en `/infrastructure` y `/backend`

## 🚀 Guías Rápidas

1.  **[Guía de Instalación Avanzada](./SETUP_GUIDE.md)**: Cómo configurar el entorno desde cero (PostgreSQL, PostGIS, .env).
2.  **[Manual de Pruebas (Testing)](./TESTING_MANUAL.md)**: Detalles sobre cómo validar la API de Merchants y búsquedas geográficas.
3.  **[Estado del Enjambre (Neural Insights)](../.neural_insights.json)**: Informe de arquitectura generado por Seeker.

## 🎯 Plan de Acción Inmediata (Swarm Tips)

- **Optimización de Entidades**: Se ha extraído la lógica de enums para romper dependencias circulares.
- **Refactorización de Servicios**: El `AuthService` ahora está modularizado con un `TokenService` independiente.
- **Consolidación**: Se eliminaron los múltiples archivos `.md` fragmentados en el backend para centralizar el conocimiento aquí.

---
*Documentación mantenida por el Vibe Swarm.*
